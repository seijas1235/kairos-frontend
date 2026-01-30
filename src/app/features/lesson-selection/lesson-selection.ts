import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../core/services/lesson';
import { Lesson } from '../../core/models/lesson.model';
import { LessonCard } from '../../shared/components/lesson-card/lesson-card';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-lesson-selection',
  imports: [CommonModule, LessonCard, LoadingSpinner],
  templateUrl: './lesson-selection.html',
  styleUrl: './lesson-selection.scss',
})
export class LessonSelection implements OnInit {
  lessons: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  isLoading = true;
  selectedSubject = 'all';
  selectedDifficulty = 'all';
  searchTerm = '';

  subjects: string[] = [];
  difficulties = ['beginner', 'intermediate', 'advanced'];

  constructor(private lessonService: LessonService) { }

  ngOnInit(): void {
    this.loadLessons();
  }

  loadLessons(): void {
    this.isLoading = true;
    this.lessonService.getAllLessons().subscribe({
      next: (lessons) => {
        this.lessons = lessons;
        this.filteredLessons = lessons;
        this.extractSubjects();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.isLoading = false;
      }
    });
  }

  extractSubjects(): void {
    const subjectSet = new Set(this.lessons.map(l => l.subject));
    this.subjects = Array.from(subjectSet);
  }

  filterLessons(): void {
    this.filteredLessons = this.lessons.filter(lesson => {
      const matchesSubject = this.selectedSubject === 'all' || lesson.subject === this.selectedSubject;
      const matchesDifficulty = this.selectedDifficulty === 'all' || lesson.difficulty === this.selectedDifficulty;
      const matchesSearch = this.searchTerm === '' ||
        lesson.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSubject && matchesDifficulty && matchesSearch;
    });
  }

  onSubjectChange(subject: string): void {
    this.selectedSubject = subject;
    this.filterLessons();
  }

  onDifficultyChange(difficulty: string): void {
    this.selectedDifficulty = difficulty;
    this.filterLessons();
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterLessons();
  }

  clearFilters(): void {
    this.selectedSubject = 'all';
    this.selectedDifficulty = 'all';
    this.searchTerm = '';
    this.filteredLessons = this.lessons;
  }
}
