import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmotionState } from '../../../core/models/emotion.model';
import { I18nService } from '../../../core/services/i18n';

@Component({
  selector: 'app-emotion-indicator',
  imports: [CommonModule],
  templateUrl: './emotion-indicator.html',
  styleUrl: './emotion-indicator.scss',
})
export class EmotionIndicator {
  @Input() emotion: EmotionState = EmotionState.Neutral;
  @Input() confidence: number = 0;

  i18n = inject(I18nService);
  EmotionState = EmotionState;

  getEmotionIcon(emotion: EmotionState): string {
    const icons: Record<EmotionState, string> = {
      [EmotionState.Engaged]: 'bi-emoji-smile-fill',
      [EmotionState.Confused]: 'bi-emoji-dizzy-fill',
      [EmotionState.Bored]: 'bi-emoji-neutral-fill',
      [EmotionState.Frustrated]: 'bi-emoji-frown-fill',
      [EmotionState.Neutral]: 'bi-emoji-expressionless-fill'
    };
    return icons[emotion];
  }

  getEmotionColor(emotion: EmotionState): string {
    const colors: Record<EmotionState, string> = {
      [EmotionState.Engaged]: 'success',
      [EmotionState.Confused]: 'warning',
      [EmotionState.Bored]: 'secondary',
      [EmotionState.Frustrated]: 'danger',
      [EmotionState.Neutral]: 'info'
    };
    return colors[emotion];
  }

  getEmotionLabel(emotion: EmotionState): string {
    const labelKeys: Record<EmotionState, string> = {
      [EmotionState.Engaged]: 'emotions.engaged',
      [EmotionState.Confused]: 'emotions.confused',
      [EmotionState.Bored]: 'emotions.bored',
      [EmotionState.Frustrated]: 'emotions.frustrated',
      [EmotionState.Neutral]: 'emotions.neutral'
    };
    return this.i18n.t(labelKeys[emotion]);
  }
}
