import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmotionDetection, EmotionState } from '../models/emotion.model';
import { DEMO_EMOTION_SEQUENCE, getRandomEmotion } from './mock-data/mock-emotions';
import { environment } from '../../../environments/environment';

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

  constructor() { }

  // Start emotion detection
  startDetection(useDemoSequence: boolean = true): void {
    if (this.isDetecting) {
      return;
    }

    this.isDetecting = true;
    this.demoSequenceIndex = 0;

    if (environment.demoMode && useDemoSequence) {
      // Use scripted demo sequence
      this.startDemoSequence();
    } else {
      // Use random emotions for testing
      this.startRandomDetection();
    }
  }

  // Start demo sequence with scripted emotions
  private startDemoSequence(): void {
    const detectionInterval = interval(environment.emotionDetectionInterval);

    detectionInterval.subscribe(() => {
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

  // Start random emotion detection for testing
  private startRandomDetection(): void {
    const detectionInterval = interval(environment.emotionDetectionInterval);

    detectionInterval.subscribe(() => {
      if (!this.isDetecting) {
        return;
      }

      const emotion = getRandomEmotion();
      this.updateEmotion(emotion);
    });
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
}
