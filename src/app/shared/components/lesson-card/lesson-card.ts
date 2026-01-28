import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Lesson } from '../../../core/models/lesson.model';

@Component({
  selector: 'app-lesson-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './lesson-card.html',
  styleUrl: './lesson-card.scss',
})
export class LessonCard {
  @Input() lesson!: Lesson;

  getDifficultyBadgeClass(difficulty: string): string {
    const classes: Record<string, string> = {
      'beginner': 'bg-success',
      'intermediate': 'bg-warning',
      'advanced': 'bg-danger'
    };
    return classes[difficulty] || 'bg-secondary';
  }

  getSubjectIcon(subject: string): string {
    const icons: Record<string, string> = {
      'Mathematics': 'bi-calculator-fill',
      'Science': 'bi-rocket-fill',
      'History': 'bi-clock-history',
      'Computer Science': 'bi-code-slash',
      'default': 'bi-book-fill'
    };
    return icons[subject] || icons['default'];
  }
}
