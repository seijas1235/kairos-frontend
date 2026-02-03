import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-learning-session',
  imports: [CommonModule, EmotionIndicator],
  templateUrl: './learning-session.html',
  styleUrl: './learning-session.scss',
})
export class LearningSession implements OnInit, OnDestroy {
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
  showCameraPermissionModal = true;
  isPaused = false;

  sessionId = `session_${Date.now()}`;

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

    this.handleCameraPermissions();
  }

  handleCameraPermissions() {
    this.showCameraPermissionModal = false;
    this.startCamera();
  }

  async startCamera() {
    const videoElement = this.videoElementRef?.nativeElement;
    if (videoElement) {
      try {
        await this.cameraService.startCamera(videoElement);
        this.isCameraActive = true;
        console.log('✅ [Sesión] Cámara iniciada correctamente');
        this.startEmotionDetection(videoElement);
      } catch (e) {
        console.warn("❌ [Sesión] Error al iniciar cámara:", e);
      }
    }
  }

  startEmotionDetection(videoElement: HTMLVideoElement) {
    this.emotionService.setVideoElement(videoElement);
    this.emotionService.startDetection(environment.demoMode, videoElement);

    this.emotionService.currentEmotion$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(emotion => {
        if (emotion && this.isCameraActive) {
          // TODO: Send emotion data to backend
        }
      });
  }

  initializeSession(lessonId: string) {
    this.isLoading = true;
    this.sessionStarted = false;

    this.realTimeService.connect();

    this.realTimeService.lessonStream$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((chunks: MessageChunk[]) => {
        console.log('⚡ [Sesión] Datos recibidos. Cola antes:', this.contentQueue.length, 'Nuevos chunks:', chunks.length);

        this.isLoading = false;
        this.sessionStarted = true;
        this.cdr.detectChanges();

        this.enqueueContent(chunks);
      });

    this.realTimeService.emotionEvents$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((event) => {
        if (event.action === 'interrupt' && this.isCameraActive) {
          this.handleInterruption();
        }
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
      this.scrollToBottom();
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

  private scrollToBottom(): void {
    if (this.messagesContainerRef) {
      setTimeout(() => {
        const container = this.messagesContainerRef.nativeElement;
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }

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
