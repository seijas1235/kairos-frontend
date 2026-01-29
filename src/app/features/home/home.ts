import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  features = [
    {
      icon: 'bi-camera-video-fill',
      title: 'Real-Time Emotion Detection',
      description: 'Advanced AI analyzes your facial expressions to understand your learning state'
    },
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Instant Content Adaptation',
      description: 'Content automatically adjusts based on your emotional state for optimal learning'
    },
    {
      icon: 'bi-shield-check-fill',
      title: 'Privacy First',
      description: 'All processing happens locally. No video data is ever stored or transmitted'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Personalized Learning',
      description: 'Each lesson adapts to your unique learning style and pace'
    }
  ];

  howItWorks = [
    {
      step: 1,
      title: 'Choose Your Lesson',
      description: 'Select from our library of interactive lessons',
      icon: 'bi-book-fill'
    },
    {
      step: 2,
      title: 'Grant Camera Access',
      description: 'Allow camera for emotion detection (privacy protected)',
      icon: 'bi-camera-fill'
    },
    {
      step: 3,
      title: 'Start Learning',
      description: 'Begin your adaptive learning journey',
      icon: 'bi-play-circle-fill'
    },
    {
      step: 4,
      title: 'Content Adapts',
      description: 'Watch as content changes based on your emotions',
      icon: 'bi-stars'
    }
  ];
}
