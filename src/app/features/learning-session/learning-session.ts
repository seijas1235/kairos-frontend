import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { I18nService } from '../../core/services/i18n';
import { LessonService } from '../../core/services/lesson';
import { EmotionDetectionService } from '../../core/services/emotion-detection';
import { CameraService } from '../../core/services/camera';
import { RealTimeService, MessageChunk } from '../../core/services/real-time.service';
import { Lesson } from '../../core/models/lesson.model';
import { EmotionDetection } from '../../core/models/emotion.model';
import { EmotionIndicator } from '../../shared/components/emotion-indicator/emotion-indicator';
import { environment } from '../../../environments/environment';
import { EmotionState } from '../../core/models/emotion.model';

@Component({
  selector: 'app-learning-session',
  imports: [CommonModule, FormsModule, EmotionIndicator],
  templateUrl: './learning-session.html',
  styleUrl: './learning-session.scss',
})
export class LearningSession implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('messagesContainer') messagesContainerRef!: ElementRef<HTMLDivElement>;

  lesson: Lesson | null = null;
  contentQueue: MessageChunk[] = [];
  displayedChunks: MessageChunk[] = [];

  private autoAdvanceTimer: any;
  private unsubscribe$ = new Subject<void>();

  sessionStarted = false;
  isDisplayingChunk = false;

  isLoading = true;
  isCameraActive = false;
  cameraLoading = false;
  cameraError: string | null = null;
  noCameraAvailable = false; // Flag to show demo mode option
  showCameraPermissionModal = true;
  isPaused = false;

  sessionId = `session_${Date.now()}`;

  // Interaction properties
  userQuestion = '';
  waitingForAnswer = false;
  isInteractionBarCollapsed = false;
  conversationHistory: Array<{role: 'tutor' | 'user', content: string}> = [];
  backendError: string | null = null;
  
  // Auto-scroll control
  private userIsScrolling = false;
  private autoScrollEnabled = true;

  // Emotion detection properties
  currentEmotion: EmotionState = EmotionState.Neutral;
  emotionConfidence: number = 0;
  EmotionState = EmotionState;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private lessonService: LessonService,
    private emotionService: EmotionDetectionService,
    private cameraService: CameraService,
    private realTimeService: RealTimeService,
    private cdr: ChangeDetectorRef,
    public i18n: I18nService
  ) { }

  async ngOnInit(): Promise<void> {
    const lessonId = this.route.snapshot.paramMap.get('lessonId');
    if (lessonId) {
      this.initializeSession(lessonId);
    } else {
      this.router.navigate(['/lessons']);
    }

    // Subscribe to emotion changes
    this.emotionService.currentEmotion$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(emotion => {
        this.currentEmotion = emotion.state;
        this.emotionConfidence = emotion.confidence;
        this.cdr.detectChanges();
        console.log('📊 [Session] Emotion updated:', emotion.state, `(${(emotion.confidence * 100).toFixed(0)}%)`);
      });
  }

  ngAfterViewInit(): void {
    // Initialize camera after view is ready
    console.log('📹 [Session] View initialized, preparing camera...');
    setTimeout(() => {
      console.log('📹 [Session] Timeout complete, starting camera initialization...');
      this.handleCameraPermissions();
    }, 1000);  // Aumentado a 1 segundo para dar más tiempo
    
    // Setup scroll detection for auto-scroll behavior
    this.setupScrollDetection();
  }
  
  private setupScrollDetection(): void {
    if (this.messagesContainerRef) {
      const container = this.messagesContainerRef.nativeElement;
      
      container.addEventListener('scroll', () => {
        // Detectar si el usuario está cerca del final (dentro de 200px)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        
        // Si el usuario scrollea hacia arriba, deshabilitar auto-scroll temporalmente
        if (!isNearBottom) {
          this.autoScrollEnabled = false;
          console.log('⏸️ [Scroll] Auto-scroll pausado (usuario scrolleando arriba)');
        } else {
          this.autoScrollEnabled = true;
          console.log('▶️ [Scroll] Auto-scroll reactivado (usuario cerca del final)');
        }
      });
    }
  }

  handleCameraPermissions() {
    console.log('🎥 [Session] handleCameraPermissions called');
    console.log('🎥 [Session] videoElementRef exists?', !!this.videoElementRef);
    console.log('🎥 [Session] videoElement exists?', !!this.videoElementRef?.nativeElement);
    
    this.showCameraPermissionModal = false;
    this.cameraLoading = true;
    this.cameraError = null;
    this.cdr.detectChanges();
    
    this.startCamera();
  }

  async startCamera() {
    const videoElement = this.videoElementRef?.nativeElement;
    
    console.log('🎥 [Session] startCamera() called');
    console.log('🎥 [Session] videoElement:', videoElement);
    
    if (!videoElement) {
      const error = 'Video element not found - DOM may not be ready';
      console.error('❌ [Session]', error);
      this.cameraError = error;
      this.cameraLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      console.log('🎥 [Session] Calling cameraService.startCamera()...');
      await this.cameraService.startCamera(videoElement);
      
      this.isCameraActive = true;
      this.cameraLoading = false;
      this.cameraError = null;
      
      console.log('✅ [Session] Camera started successfully!');
      console.log('✅ [Session] isCameraActive:', this.isCameraActive);
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Start emotion detection
      this.startEmotionDetection(videoElement);
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      console.error('❌ [Session] Error starting camera:', e);
      console.error('❌ [Session] Error details:', {
        name: e?.name,
        message: e?.message,
        stack: e?.stack
      });
      
      // Check if error is due to no camera available
      const noCameraDetected = errorMsg.includes('No se encontró cámara') || 
                                errorMsg.includes('NotFoundError') ||
                                errorMsg.includes('not found');
      
      this.isCameraActive = false;
      this.cameraLoading = false;
      this.cameraError = errorMsg;
      this.noCameraAvailable = noCameraDetected;
      this.cdr.detectChanges();
    }
  }

  startEmotionDetection(videoElement: HTMLVideoElement | null = null) {
    console.log(`🧠 [Session] Starting emotion detection (interval: ${environment.emotionDetectionInterval}ms = ${environment.emotionDetectionInterval/1000}s)`);
    
    if (videoElement) {
      this.emotionService.setVideoElement(videoElement);
    }
    this.emotionService.startDetection(true, videoElement || undefined); // Force demo mode if no video

    console.log('✅ [Session] Emotion detection active (demo mode)');
  }

  continueWithDemoMode() {
    console.log('🎭 [Session] User chose to continue with demo mode (no camera)');
    
    this.showCameraPermissionModal = false;
    this.cameraError = null;
    this.noCameraAvailable = false;
    this.isCameraActive = false; // No real camera
    
    // Start emotion detection in demo mode (no video element)
    this.startEmotionDetection(null);
    
    this.cdr.detectChanges();
  }

  initializeSession(lessonId: string) {
    this.isLoading = true;
    this.sessionStarted = false;
    this.sessionStartTime = new Date(); // ✅ Track start time

    this.realTimeService.connect();

    this.realTimeService.lessonStream$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((chunks: MessageChunk[]) => {
        console.log('⚡ [Sesión] Datos recibidos. Cola antes:', this.contentQueue.length, 'Nuevos chunks:', chunks.length);

        this.isLoading = false;
        this.sessionStarted = true;

        // Check if this is an answer to user question
        const isAnswer = (chunks[0] as any).type === 'tutor_answer';
        
        if (isAnswer) {
          this.handleAnswerFromTutor(chunks[0].content);
        } else {
          this.enqueueContent(chunks);
        }

        this.cdr.detectChanges();
      });

    this.realTimeService.emotionEvents$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((event) => {
        if (event.action === 'interrupt' && this.isCameraActive) {
          this.handleInterruption();
        }
      });

    // Subscribe to errors
    this.realTimeService.errors$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((error) => {
        console.error('🚨 [Session] Backend error received:', error);
        this.backendError = error.message;
        this.waitingForAnswer = false;
        this.cdr.detectChanges();
        
        // Clear error after 5 seconds
        setTimeout(() => {
          this.backendError = null;
          this.cdr.detectChanges();
        }, 5000);
      });

    setTimeout(() => {
      this.realTimeService.sendMessage({
        start_lesson: true,
        lessonId: lessonId,
        style: 'Mixto'
      });
    }, 1000);
  }

  enqueueContent(chunks: MessageChunk[]) {
    this.contentQueue.push(...chunks);
    this.processQueue();
  }

  processQueue() {
    if (this.isPaused || this.contentQueue.length === 0 || this.isDisplayingChunk) {
      return;
    }

    this.isDisplayingChunk = true;

    const nextChunk = this.contentQueue.shift();
    if (nextChunk) {
      console.log('📝 [Sesión] Mostrando chunk:', nextChunk.type);
      this.displayedChunks.push(nextChunk);
      this.cdr.detectChanges();
      
      // Auto-scroll inmediato y luego verificar
      this.scrollToBottom();
      // Segundo intento después de renderizado completo
      setTimeout(() => this.scrollToBottom(), 300);
      
      this.calculateReadTimeAndAdvance(nextChunk);
    } else {
      this.isDisplayingChunk = false;
    }
  }

  calculateReadTimeAndAdvance(chunk: MessageChunk) {
    let delay = 3000;

    if (chunk.type === 'text') {
      const wordCount = chunk.content.split(' ').length;
      delay = Math.max(2000, (wordCount / 3.5) * 1000);
    } else if (chunk.type === 'image_prompt') {
      delay = 5000;
    }

    this.autoAdvanceTimer = setTimeout(() => {
      this.autoAdvanceTimer = null;
      this.isDisplayingChunk = false;
      this.processQueue();
    }, delay);
  }

  handleInterruption() {
    this.isPaused = true;
    this.cdr.detectChanges();
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  resumeSession() {
    this.isPaused = false;
    this.isDisplayingChunk = false;
    this.cdr.detectChanges();
    this.processQueue();
  }

  // NEW: Pause for question
  pauseForQuestion(): void {
    this.isPaused = true;
    this.isInteractionBarCollapsed = false;
    
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    
    console.log('⏸️ [Session] Paused for user question');
  }

  // NEW: Send user question to backend
  sendQuestion(): void {
    if (!this.userQuestion.trim()) return;

    const question = this.userQuestion.trim();
    this.userQuestion = '';
    this.waitingForAnswer = true;

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: question
    });

    // Display user question in UI
    this.displayedChunks.push({
      type: 'user_question',
      content: question
    } as any);

    this.cdr.detectChanges();
    // Auto-scroll después de mostrar pregunta
    this.scrollToBottom();
    setTimeout(() => this.scrollToBottom(), 300);

    // Send to backend
    const payload = {
      type: 'user_question',
      question: question,
      context: this.conversationHistory,
      current_topic: this.getCurrentTopic()
    };
    
    console.log('❓ [Session] Sending question to backend:', payload);
    this.realTimeService.sendMessage(payload);
  }

  // NEW: Handle answer from backend
  private handleAnswerFromTutor(answer: string): void {
    this.waitingForAnswer = false;

    // Add to conversation history
    this.conversationHistory.push({
      role: 'tutor',
      content: answer
    });

    // Display answer
    this.displayedChunks.push({
      type: 'tutor_answer',
      content: answer
    } as any);

    this.cdr.detectChanges();
    // Auto-scroll después de mostrar respuesta
    this.scrollToBottom();
    setTimeout(() => this.scrollToBottom(), 300);

    // Resume after 2 seconds
    setTimeout(() => {
      this.resumeSession();
    }, 2000);

    console.log('✅ [Session] Answer received, resuming...');
  }

  private getCurrentTopic(): string {
    return this.lesson?.title || 'current lesson';
  }

  private scrollToBottom(): void {
    // Solo hacer auto-scroll si está habilitado
    if (!this.autoScrollEnabled) {
      console.log('⏭️ [Scroll] Auto-scroll omitido (usuario scrolleando manualmente)');
      return;
    }
    
    if (this.messagesContainerRef) {
      setTimeout(() => {
        const container = this.messagesContainerRef.nativeElement;
        // Scroll suave hacia abajo
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
        
        console.log('🔽 [Scroll] Auto-scroll ejecutado. ScrollHeight:', container.scrollHeight);
      }, 150);
    }
  }

  // Finish session and save results
  finishSession(): void {
    console.log('🏁 [Session] Finishing session...');
    
    // Prepare session summary
    const sessionSummary = {
      sessionId: this.sessionId,
      lesson: this.lesson,
      startTime: this.sessionStartTime || new Date(),
      endTime: new Date(),
      totalChunks: this.displayedChunks.length,
      emotionHistory: this.emotionService.getEmotionHistory(),
      conversationHistory: this.conversationHistory,
      completedTopics: this.displayedChunks.filter(c => c.type === 'text').length
    };
    
    // ✅ Send session completion to backend
    console.log('📤 [Session] Sending session_complete to backend...');
    this.realTimeService.sendMessage({
      type: 'session_complete',
      sessionId: this.sessionId,
      summary: {
        duration: Math.floor((new Date().getTime() - (this.sessionStartTime?.getTime() || 0)) / 1000), // in seconds
        totalChunks: this.displayedChunks.length,
        completedTopics: this.displayedChunks.filter(c => c.type === 'text').length,
        questionsAsked: this.conversationHistory.filter(c => c.role === 'user').length,
        emotionSummary: this.getEmotionSummary()
      }
    });
    
    // Save to localStorage
    const existingHistory = JSON.parse(localStorage.getItem('kairos_session_history') || '[]');
    existingHistory.push(sessionSummary);
    localStorage.setItem('kairos_session_history', JSON.stringify(existingHistory));
    
    console.log('✅ [Session] Session saved:', sessionSummary);
    
    // Stop camera and emotion detection
    this.stopCamera();
    
    // Disconnect WebSocket (after a small delay to ensure message is sent)
    setTimeout(() => {
      this.realTimeService.disconnect();
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    }, 500);
  }
  
  // Helper to get emotion summary
  private getEmotionSummary(): any {
    const emotions = this.emotionService.getEmotionHistory();
    if (emotions.length === 0) return null;
    
    const emotionCounts: any = {};
    emotions.forEach(e => {
      emotionCounts[e.state] = (emotionCounts[e.state] || 0) + 1;
    });
    
    return {
      totalDetections: emotions.length,
      distribution: emotionCounts,
      avgConfidence: emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length
    };
  }

  // Helper for encoding image URLs
  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  private sessionStartTime: Date | null = null;

  ngOnDestroy(): void {
    console.log('🔴 [LearningSession] Componente destruido');
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.realTimeService.disconnect();
    this.stopCamera();
  }

  stopCamera() {
    console.log('🎥 [LearningSession] Deteniendo cámara');
    this.cameraService.stopCamera();
    this.emotionService.stopDetection();
    this.isCameraActive = false;
  }
}
