import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/services/i18n';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  i18n = inject(I18nService);

  features = [
    { key: 'emotionDetection', icon: 'bi-camera-video-fill' },
    { key: 'adaptiveContent', icon: 'bi-lightning-charge-fill' },
    { key: 'privacyFirst', icon: 'bi-shield-check-fill' },
    { key: 'personalizedPaths', icon: 'bi-graph-up-arrow' }
  ];

  howItWorks = [
    { step: 1, icon: 'bi-book-fill' },
    { step: 2, icon: 'bi-camera-fill' },
    { step: 3, icon: 'bi-play-circle-fill' },
    { step: 4, icon: 'bi-stars' }
  ];
}
