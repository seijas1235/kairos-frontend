import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LessonService } from '../../core/services/lesson';
import { EmotionDetectionService } from '../../core/services/emotion-detection';
import { CameraService } from '../../core/services/camera';
import { AdaptationService } from '../../core/services/adaptation';
import { WebSocketService } from '../../core/services/websocket.service';
import { Lesson, ContentBlock } from '../../core/models/lesson.model';
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

  lesson: Lesson | null = null;
  currentBlock: ContentBlock | null = null;
  currentEmotion: EmotionDetection | null = null;
  adaptationHistory: AdaptationEvent[] = [];

  isLoading = true;
  isCameraActive = false;
  showCameraPermissionModal = true;
  sessionId = `session_${Date.now()}`;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private emotionService: EmotionDetectionService,
    private cameraService: CameraService,
    private adaptationService: AdaptationService,
    private wsService: WebSocketService
  ) { }

  ngOnInit(): void {
    const lessonId = this.route.snapshot.paramMap.get('lessonId');
    if (lessonId) {
      this.loadLesson(lessonId);
    } else {
      this.router.navigate(['/lessons']);
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
        if (lesson) {
          this.lesson = lesson;
          this.currentBlock = lesson.contentBlocks[0];
          this.isLoading = false;
        } else {
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
      const videoElement = this.videoElementRef?.nativeElement;

      // Start camera with video element
      if (videoElement) {
        await this.cameraService.startCamera(videoElement);
      } else {
        await this.cameraService.startCamera();
      }

      this.isCameraActive = true;
      this.showCameraPermissionModal = false;

      // Start emotion detection
      // Use demo mode if configured, otherwise use real backend
      const useDemoMode = environment.demoMode;
      await this.emotionService.startDetection(useDemoMode, videoElement);

      // Subscribe to emotion changes
      const emotionSub = this.emotionService.currentEmotion$.subscribe(emotion => {
        this.currentEmotion = emotion;
        this.handleEmotionChange(emotion);
      });
      this.subscriptions.push(emotionSub);

      // Subscribe to adaptation history
      const adaptationSub = this.adaptationService.adaptationHistory$.subscribe(history => {
        this.adaptationHistory = history;
      });
      this.subscriptions.push(adaptationSub);

      // Start the lesson
      if (this.lesson) {
        this.lessonService.startLesson(this.lesson.id);
      }

      console.log(`Learning session started (${useDemoMode ? 'DEMO' : 'REAL'} mode)`);

    } catch (error: any) {
      console.error('Error starting learning session:', error);
      const errorMsg = error.message || 'Failed to start camera. Please check permissions.';
      alert(errorMsg);
      this.showCameraPermissionModal = false;
      this.router.navigate(['/lessons']);
    }
  }

  handleEmotionChange(emotion: EmotionDetection): void {
    if (!this.currentBlock || !this.lesson) return;

    // Check if we should adapt content
    if (this.adaptationService.shouldAdapt(emotion.state)) {
      const adaptedBlock = this.adaptationService.getAdaptedContent(this.currentBlock, emotion.state);

      if (adaptedBlock) {
        // Record the adaptation
        const strategy = this.adaptationService.getAdaptationStrategy(emotion.state);
        const description = this.adaptationService.getAdaptationDescription(emotion.state, strategy);

        this.adaptationService.recordAdaptation(
          emotion.state,
          strategy,
          this.currentBlock.id,
          description
        );

        // Switch to adapted content
        this.currentBlock = adaptedBlock;
      }
    }
  }

  nextBlock(): void {
    if (!this.lesson || !this.currentBlock) return;

    const currentIndex = this.lesson.contentBlocks.findIndex(b => b.id === this.currentBlock!.id);
    if (currentIndex < this.lesson.contentBlocks.length - 1) {
      this.currentBlock = this.lesson.contentBlocks[currentIndex + 1];
      this.lessonService.completeBlock(this.lesson.contentBlocks[currentIndex].id);
    } else {
      this.completeLesson();
    }
  }

  previousBlock(): void {
    if (!this.lesson || !this.currentBlock) return;

    const currentIndex = this.lesson.contentBlocks.findIndex(b => b.id === this.currentBlock!.id);
    if (currentIndex > 0) {
      this.currentBlock = this.lesson.contentBlocks[currentIndex - 1];
    }
  }

  completeLesson(): void {
    this.stopLearningSession();
    alert('Congratulations! You completed the lesson!');
    this.router.navigate(['/dashboard']);
  }

  exitLesson(): void {
    if (confirm('Are you sure you want to exit this lesson?')) {
      this.stopLearningSession();
      this.router.navigate(['/lessons']);
    }
  }

  stopLearningSession(): void {
    this.emotionService.stopDetection();
    this.cameraService.stopCamera();
    this.lessonService.clearProgress();
    this.isCameraActive = false;

    // Disconnect WebSocket
    if (!environment.demoMode) {
      this.wsService.disconnect();
    }
  }

  denyCamera(): void {
    this.showCameraPermissionModal = false;
    this.router.navigate(['/lessons']);
  }

  getProgressPercentage(): number {
    if (!this.lesson || !this.currentBlock) return 0;
    const currentIndex = this.lesson.contentBlocks.findIndex(b => b.id === this.currentBlock!.id);
    return ((currentIndex + 1) / this.lesson.contentBlocks.length) * 100;
  }

  getCurrentBlockNumber(): number {
    if (!this.lesson || !this.currentBlock) return 0;
    return this.lesson.contentBlocks.findIndex(b => b.id === this.currentBlock!.id) + 1;
  }

  getTotalBlocks(): number {
    return this.lesson?.contentBlocks.length || 0;
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
}
