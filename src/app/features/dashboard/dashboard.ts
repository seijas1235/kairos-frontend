import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LessonService } from '../../core/services/lesson';
import { Lesson } from '../../core/models/lesson.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  recentLessons: Lesson[] = [];
  totalLessons = 0;
  completedLessons = 0;
  learningStreak = 0;

  constructor(private lessonService: LessonService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.lessonService.getAllLessons().subscribe({
      next: (lessons) => {
        this.totalLessons = lessons.length;
        this.recentLessons = lessons.slice(0, 3);
        // Data from local service only
        this.completedLessons = lessons.filter(l => l.progress === 100).length;
        // Streak calculation would need real history logic, defaulting to 0 or handled by service
      }
    });
  }

  getProgressPercentage(): number {
    if (this.totalLessons === 0) return 0;
    return (this.completedLessons / this.totalLessons) * 100;
  }
}
