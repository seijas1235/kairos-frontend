import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { I18nService } from '../../core/services/i18n';
import { LessonService } from '../../core/services/lesson';
import { EmotionDetectionService } from '../../core/services/emotion-detection';
import { CameraService } from '../../core/services/camera';
import { AdaptationService } from '../../core/services/adaptation';
import { WebSocketService } from '../../core/services/websocket.service';
import { Lesson, Topic, Message } from '../../core/models/lesson.model';
import { EmotionDetection, EmotionState } from '../../core/models/emotion.model';
import { AdaptationEvent } from '../../core/models/adaptation.model';
import { EmotionIndicator } from '../../shared/components/emotion-indicator/emotion-indicator';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-learning-session',
  imports: [CommonModule, EmotionIndicator, LoadingSpinner],
  templateUrl: './learning-session.html',
  styleUrl: './learning-session.scss',
})
export class LearningSession implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('messagesContainer') messagesContainerRef!: ElementRef<HTMLDivElement>;

  // Lesson data
  lesson: Lesson | null = null;
  currentTopic: Topic | null = null;
  currentTopicIndex: number = 0;
  currentMessageIndex: number = 0;

  // Session history (all messages shown so far)
  sessionHistory: Message[] = [];

  // Current state
  currentEmotion: EmotionDetection | null = null;

  // UI state
  isLoading = true;
  isCameraActive = false;
  showCameraPermissionModal = true;
  isWaitingForContinue = false;
  isGeneratingMoreTopics = false;
  showCompletionModal = false;

  sessionId = `session_${Date.now()}`;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private lessonService: LessonService,
    private emotionService: EmotionDetectionService,
    private cameraService: CameraService,
    private adaptationService: AdaptationService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef,
    public i18n: I18nService
  ) { }

  async ngOnInit(): Promise<void> {
    const lessonId = this.route.snapshot.paramMap.get('lessonId');
    if (lessonId) {
      this.loadLesson(lessonId);
    } else {
      this.router.navigate(['/lessons']);
    }

    // Check if we already have camera permission
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

      if (permissionStatus.state === 'granted') {
        console.log('Camera permission already granted, starting session...');
        this.showCameraPermissionModal = false;
        this.cdr.detectChanges();
        setTimeout(() => this.startLearningSession(), 500);
      } else {
        this.showCameraPermissionModal = true;
        this.cdr.detectChanges();
      }

      permissionStatus.onchange = () => {
        if (permissionStatus.state === 'granted' && !this.isCameraActive) {
          this.showCameraPermissionModal = false;
          this.cdr.detectChanges();
          this.startLearningSession();
        }
      };
    } catch (error) {
      console.log('Permissions API not available, showing modal');
      this.showCameraPermissionModal = true;
      this.cdr.detectChanges();
    }

    // Connect to WebSocket if not in demo mode
    if (!environment.demoMode) {
      this.wsService.connect(this.sessionId);
    }
  }

  ngAfterViewInit(): void {
    // Video element is now available
  }

  ngOnDestroy(): void {
    this.stopLearningSession();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadLesson(lessonId: string): void {
    this.lessonService.getLessonById(lessonId).subscribe({
      next: (lesson) => {
        if (lesson && lesson.curriculum) {
          this.lesson = lesson;
          this.currentTopicIndex = lesson.curriculum.currentTopicIndex || 0;
          this.currentTopic = lesson.curriculum.topics[this.currentTopicIndex];
          this.currentMessageIndex = 0;
          this.isLoading = false;

          // Initialize session history if exists
          if (lesson.sessionHistory) {
            this.sessionHistory = lesson.sessionHistory;
          }
        } else {
          console.error('Lesson not found or has no curriculum');
          this.router.navigate(['/lessons']);
        }
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        this.router.navigate(['/lessons']);
      }
    });
  }

  async startLearningSession(): Promise<void> {
    try {
      console.log('Starting learning session...');

      const videoElement = this.videoElementRef?.nativeElement;
      if (!videoElement) {
        console.warn('Video element not found, continuing without camera');
        // Continue without camera - show first message anyway
        this.isCameraActive = false;
        this.showCameraPermissionModal = false;
        this.showNextMessage();
        return;
      }

      // Start camera with video element
      try {
        await this.cameraService.startCamera(videoElement);
        this.isCameraActive = true;
        console.log('Camera started successfully');
      } catch (cameraError) {
        console.warn('Failed to start camera, continuing without it:', cameraError);
        this.isCameraActive = false;
      }

      // Update flags
      this.showCameraPermissionModal = false;

      console.log('Camera active:', this.isCameraActive, 'modal should be hidden');

      // Start emotion detection only if camera is active
      if (this.isCameraActive) {
        const useDemoMode = environment.demoMode;
        this.emotionService.setVideoElement(videoElement);
        await this.emotionService.startDetection(useDemoMode, videoElement);

        // Subscribe to emotion changes
        const emotionSub = this.emotionService.currentEmotion$.subscribe(emotion => {
          if (emotion) {
            this.currentEmotion = emotion;
            this.handleEmotionChange(emotion);
          }
        });
        this.subscriptions.push(emotionSub);

        console.log('Learning session started (REAL mode)');
      } else {
        console.log('Learning session started (NO CAMERA mode)');
      }

      // Show first message
      this.showNextMessage();

    } catch (error) {
      console.error('Error starting learning session:', error);
      // Don't block the lesson, just continue without camera
      this.isCameraActive = false;
      this.showCameraPermissionModal = false;
      this.showNextMessage();
    }
  }

  stopLearningSession(): void {
    console.log('Stopping learning session...');

    this.emotionService.stopDetection();
    this.cameraService.stopCamera();

    if (!environment.demoMode) {
      this.wsService.disconnect();
    }

    this.isCameraActive = false;
    console.log('Camera stopped');
  }

  /**
   * Show the next message in the current topic
   */
  showNextMessage(): void {
    if (!this.currentTopic || !this.lesson) return;

    // Get all remaining messages in the current topic
    const remainingMessages = this.currentTopic.messages.slice(this.currentMessageIndex);

    if (remainingMessages.length === 0) {
      // No more messages in this topic, move to next topic
      this.completeCurrentTopic();
      return;
    }

    // Add ALL remaining messages to session history at once
    remainingMessages.forEach((message, index) => {
      this.sessionHistory.push({
        ...message,
        timestamp: new Date(Date.now() + index * 100) // Slight stagger for visual effect
      });
    });

    // Update message index to end of topic
    this.currentMessageIndex = this.currentTopic.messages.length;

    // Save to lesson
    if (this.lesson) {
      this.lesson.sessionHistory = this.sessionHistory;
      this.lessonService.updateProgress({
        lessonId: this.lesson.id,
        currentTopicIndex: this.currentTopicIndex,
        currentMessageIndex: this.currentMessageIndex,
        completedTopics: [],
        startedAt: new Date(),
        lastUpdated: new Date(),
        emotionHistory: []
      });
    }

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Complete the current topic and move to next
   */
  completeCurrentTopic(): void {
    if (!this.lesson || !this.lesson.curriculum) return;

    // Mark topic as completed
    if (this.currentTopic) {
      this.currentTopic.completed = true;
    }

    // Check if there are more topics
    if (this.currentTopicIndex < this.lesson.curriculum.topics.length - 1) {
      // Move to next topic
      this.currentTopicIndex++;
      this.currentMessageIndex = 0;
      this.currentTopic = this.lesson.curriculum.topics[this.currentTopicIndex];

      // Update curriculum
      this.lesson.curriculum.currentTopicIndex = this.currentTopicIndex;

      // Show first message of new topic
      this.showNextMessage();
    } else {
      // No more topics, ask if user wants to continue or finish
      this.isWaitingForContinue = true;
    }
  }

  /**
   * User wants to continue with more topics
   */
  async continueWithMoreTopics(): Promise<void> {
    if (!this.lesson) return;

    this.isGeneratingMoreTopics = true;
    this.isWaitingForContinue = false;

    try {
      const newTopics = await this.lessonService.continueLesson(this.lesson, 6);

      if (newTopics && newTopics.length > 0) {
        // Move to first new topic
        this.currentTopicIndex = this.lesson.curriculum!.topics.length - newTopics.length;
        this.currentMessageIndex = 0;
        this.currentTopic = this.lesson.curriculum!.topics[this.currentTopicIndex];

        // Add system message
        this.sessionHistory.push({
          type: 'system',
          content: '¡Genial! Continuemos con más temas interesantes...',
          timestamp: new Date()
        });

        // Show first message of new topic
        this.showNextMessage();
      }
    } catch (error) {
      console.error('Error generating more topics:', error);
      alert('Error al generar más temas. Por favor intenta de nuevo.');
    } finally {
      this.isGeneratingMoreTopics = false;
    }
  }

  /**
   * User wants to finish the lesson
   */
  finishLesson(): void {
    if (!this.lesson) return;

    this.isWaitingForContinue = false;
    this.showCompletionModal = true;

    // Mark lesson as completed
    this.lessonService.completeLesson(this.lesson.id);

    // Stop camera and emotion detection
    this.stopLearningSession();
  }

  /**
   * Navigate back to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handle emotion changes and adapt content if needed
   */
  private async handleEmotionChange(emotion: EmotionDetection): Promise<void> {
    if (!this.currentTopic || !this.lesson) return;

    const emotionState = emotion.state;

    // Only adapt if emotion is confused or bored
    if (emotionState === 'confused' || emotionState === 'bored') {
      // Get the last AI message
      const lastAiMessage = [...this.sessionHistory]
        .reverse()
        .find(m => m.type === 'ai');

      if (lastAiMessage && !lastAiMessage.adapted) {
        try {
          const adaptedMessage = await this.lessonService.adaptMessage(
            lastAiMessage,
            emotionState,
            {
              topic: this.lesson.subject,
              level: this.lesson.difficulty,
              currentTopic: this.currentTopic.title
            }
          );

          // Replace the message in history
          const index = this.sessionHistory.findIndex(m => m.id === lastAiMessage.id);
          if (index !== -1) {
            this.sessionHistory[index] = adaptedMessage;
          }
        } catch (error) {
          console.error('Error adapting message:', error);
        }
      }
    }
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    if (this.messagesContainerRef) {
      const container = this.messagesContainerRef.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    if (!this.lesson || !this.lesson.curriculum) return 0;

    const totalTopics = this.lesson.curriculum.totalTopics;
    const completedTopics = this.currentTopicIndex;

    return Math.round((completedTopics / totalTopics) * 100);
  }

  /**
   * Get current topic number for display
   */
  getCurrentTopicNumber(): string {
    return `${this.currentTopicIndex + 1} / ${this.lesson?.curriculum?.totalTopics || 0}`;
  }
}
