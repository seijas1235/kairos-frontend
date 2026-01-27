import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EmotionState } from '../models/emotion.model';
import { AdaptationEvent, AdaptationStrategy } from '../models/adaptation.model';
import { ContentBlock } from '../models/lesson.model';

@Injectable({
  providedIn: 'root'
})
export class AdaptationService {
  private adaptationHistorySubject = new BehaviorSubject<AdaptationEvent[]>([]);
  public adaptationHistory$ = this.adaptationHistorySubject.asObservable();

  constructor() { }

  // Determine if content should be adapted based on emotion
  shouldAdapt(emotion: EmotionState): boolean {
    // Adapt for confused, bored, or frustrated states
    return emotion === EmotionState.Confused ||
      emotion === EmotionState.Bored ||
      emotion === EmotionState.Frustrated;
  }

  // Get adaptation strategy based on emotion
  getAdaptationStrategy(emotion: EmotionState): AdaptationStrategy {
    switch (emotion) {
      case EmotionState.Confused:
        return AdaptationStrategy.VisualExplanation;
      case EmotionState.Bored:
        return AdaptationStrategy.Gamification;
      case EmotionState.Frustrated:
        return AdaptationStrategy.Simplification;
      default:
        return AdaptationStrategy.VisualExplanation;
    }
  }

  // Get adapted content block based on emotion
  getAdaptedContent(
    originalBlock: ContentBlock,
    emotion: EmotionState
  ): ContentBlock | null {
    if (!this.shouldAdapt(emotion)) {
      return null;
    }

    const emotionKey = emotion.toLowerCase();

    if (originalBlock.adaptationVariants && originalBlock.adaptationVariants[emotionKey]) {
      return originalBlock.adaptationVariants[emotionKey];
    }

    return null;
  }

  // Record an adaptation event
  recordAdaptation(
    emotion: EmotionState,
    strategy: AdaptationStrategy,
    contentBlockId: string,
    description: string
  ): void {
    const event: AdaptationEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      fromEmotion: emotion,
      strategy,
      description,
      contentBlockId
    };

    const history = this.adaptationHistorySubject.value;
    history.push(event);

    // Keep only last 20 adaptations
    if (history.length > 20) {
      history.shift();
    }

    this.adaptationHistorySubject.next(history);
  }

  // Get adaptation description for UI display
  getAdaptationDescription(emotion: EmotionState, strategy: AdaptationStrategy): string {
    const descriptions: Record<string, Record<string, string>> = {
      [EmotionState.Confused]: {
        [AdaptationStrategy.VisualExplanation]: 'Switched to visual explanation to clarify concepts',
        [AdaptationStrategy.Simplification]: 'Simplified the explanation for better understanding'
      },
      [EmotionState.Bored]: {
        [AdaptationStrategy.Gamification]: 'Added interactive challenge to increase engagement',
        [AdaptationStrategy.Analogy]: 'Used real-world analogy to make it more interesting'
      },
      [EmotionState.Frustrated]: {
        [AdaptationStrategy.Simplification]: 'Broke down into simpler steps',
        [AdaptationStrategy.BreakSuggestion]: 'Suggested taking a short break'
      }
    };

    return descriptions[emotion]?.[strategy] || 'Adapted content based on your emotional state';
  }

  // Get adaptation history
  getAdaptationHistory(): AdaptationEvent[] {
    return this.adaptationHistorySubject.value;
  }

  // Clear adaptation history
  clearHistory(): void {
    this.adaptationHistorySubject.next([]);
  }

  // Generate unique ID for adaptation events
  private generateId(): string {
    return `adapt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
