import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { EmotionDetection, EmotionState } from '../models/emotion.model';
import { DEMO_EMOTION_SEQUENCE, getRandomEmotion } from './mock-data/mock-emotions';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';
import { CameraService } from './camera';

@Injectable({
  providedIn: 'root'
})
export class EmotionDetectionService {
  private currentEmotionSubject = new BehaviorSubject<EmotionDetection>({
    state: EmotionState.Neutral,
    confidence: 0.0,
    timestamp: new Date()
  });

  public currentEmotion$ = this.currentEmotionSubject.asObservable();

  private emotionHistorySubject = new BehaviorSubject<EmotionDetection[]>([]);
  public emotionHistory$ = this.emotionHistorySubject.asObservable();

  private isDetecting = false;
  private demoSequenceIndex = 0;
  private detectionSubscription: Subscription | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor(
    private wsService: WebSocketService,
    private cameraService: CameraService
  ) {
    // Listen to WebSocket messages for emotion results
    this.wsService.messages$.subscribe(message => {
      if (message.type === 'emotion_result') {
        this.handleEmotionResult(message);
      }
    });
  }

  // Start emotion detection
  async startDetection(useDemoSequence: boolean = true, videoElement?: HTMLVideoElement): Promise<void> {
    if (this.isDetecting) {
      return;
    }

    this.isDetecting = true;
    this.demoSequenceIndex = 0;

    if (videoElement) {
      this.videoElement = videoElement;
    }

    if (environment.demoMode && useDemoSequence) {
      // Use scripted demo sequence
      this.startDemoSequence();
    } else {
      // Use real backend with camera
      await this.startRealDetection();
    }
  }

  // Start demo sequence with scripted emotions
  private startDemoSequence(): void {
    const detectionInterval = interval(environment.emotionDetectionInterval);

    this.detectionSubscription = detectionInterval.subscribe(() => {
      if (!this.isDetecting) {
        return;
      }

      if (this.demoSequenceIndex < DEMO_EMOTION_SEQUENCE.length) {
        const emotion = {
          ...DEMO_EMOTION_SEQUENCE[this.demoSequenceIndex],
          timestamp: new Date()
        };
        this.updateEmotion(emotion);
        this.demoSequenceIndex++;
      } else {
        // Loop back to start or stay at last emotion
        const lastEmotion = {
          ...DEMO_EMOTION_SEQUENCE[DEMO_EMOTION_SEQUENCE.length - 1],
          timestamp: new Date()
        };
        this.updateEmotion(lastEmotion);
      }
    });
  }

  // Start real emotion detection with backend
  private async startRealDetection(): Promise<void> {
    if (!this.videoElement) {
      console.error('Video element not provided for real detection');
      return;
    }

    // Start camera if not already active
    if (!this.cameraService.isCameraActive()) {
      await this.cameraService.startCamera(this.videoElement);
    }

    const detectionInterval = interval(environment.emotionDetectionInterval);

    this.detectionSubscription = detectionInterval.subscribe(() => {
      if (!this.isDetecting || !this.videoElement) {
        return;
      }

      // Capture frame from video
      const frameData = this.cameraService.captureFrame(this.videoElement);

      if (frameData) {
        // Send frame to backend via WebSocket
        this.wsService.send({
          type: 'emotion_frame',
          frame: frameData,
          timestamp: new Date().toISOString(),
          current_content: this.getCurrentContent(),
          user_profile: this.getUserProfile(),
          topic: this.getCurrentTopic(),
          difficulty: 'intermediate'
        });
      }
    });
  }

  // Handle emotion result from backend
  private handleEmotionResult(message: any): void {
    if (message.emotion) {
      const emotion: EmotionDetection = {
        state: this.mapEmotionString(message.emotion.emotion),
        confidence: message.emotion.confidence || 0.0,
        timestamp: new Date()
      };

      this.updateEmotion(emotion);

      // Handle content adaptation if needed
      if (message.action === 'adapt' && message.adapted_content) {
        // Emit adaptation event (can be subscribed to by components)
        console.log('Content adaptation received:', message.adapted_content);
        // You can add a Subject here to emit adaptation events
      }
    }
  }

  // Map emotion string from backend to EmotionState enum
  private mapEmotionString(emotion: string): EmotionState {
    const emotionMap: { [key: string]: EmotionState } = {
      'engaged': EmotionState.Engaged,
      'confused': EmotionState.Confused,
      'bored': EmotionState.Bored,
      'frustrated': EmotionState.Frustrated,
      'neutral': EmotionState.Neutral
    };

    return emotionMap[emotion.toLowerCase()] || EmotionState.Neutral;
  }

  // Get current content for backend
  private getCurrentContent(): any {
    // This should be provided by the learning session component
    // For now, return a placeholder
    return {
      title: 'Current Lesson',
      body: 'Learning content...',
      type: 'text'
    };
  }

  // Get user profile for backend
  private getUserProfile(): any {
    // This should come from user service
    // For now, return a placeholder
    return {
      learning_style: 'visual',
      age: 14,
      interests: ['mathematics', 'science']
    };
  }

  // Get current topic
  private getCurrentTopic(): string {
    // This should be provided by the learning session
    return 'Mathematics';
  }

  // Update current emotion and add to history
  private updateEmotion(emotion: EmotionDetection): void {
    this.currentEmotionSubject.next(emotion);

    const history = this.emotionHistorySubject.value;
    history.push(emotion);

    // Keep only last 50 emotions in history
    if (history.length > 50) {
      history.shift();
    }

    this.emotionHistorySubject.next(history);

    if (environment.enableCameraDebug) {
      console.log('Emotion detected:', emotion);
    }
  }

  // Stop emotion detection
  stopDetection(): void {
    this.isDetecting = false;

    if (this.detectionSubscription) {
      this.detectionSubscription.unsubscribe();
      this.detectionSubscription = null;
    }
  }

  // Get current emotion
  getCurrentEmotion(): EmotionDetection {
    return this.currentEmotionSubject.value;
  }

  // Get emotion history
  getEmotionHistory(): EmotionDetection[] {
    return this.emotionHistorySubject.value;
  }

  // Clear emotion history
  clearHistory(): void {
    this.emotionHistorySubject.next([]);
  }

  // Manually set emotion (for testing)
  setEmotion(state: EmotionState, confidence: number = 0.85): void {
    const emotion: EmotionDetection = {
      state,
      confidence,
      timestamp: new Date()
    };
    this.updateEmotion(emotion);
  }

  // Set video element for real detection
  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
  }
}
