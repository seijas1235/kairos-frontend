import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Lesson, LessonProgress } from '../models/lesson.model';
import { MOCK_LESSONS } from './mock-data/mock-lessons';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private currentProgressSubject = new BehaviorSubject<LessonProgress | null>(null);
  public currentProgress$ = this.currentProgressSubject.asObservable();

  constructor() { }

  // Get all available lessons
  getAllLessons(): Observable<Lesson[]> {
    if (environment.useMockData) {
      return of(MOCK_LESSONS);
    }
    // TODO: Replace with actual API call when backend is ready
    // return this.http.get<Lesson[]>(`${environment.apiUrl}/lessons`);
    return of(MOCK_LESSONS);
  }

  // Get a specific lesson by ID
  getLessonById(id: string): Observable<Lesson | undefined> {
    if (environment.useMockData) {
      const lesson = MOCK_LESSONS.find(l => l.id === id);
      return of(lesson);
    }
    // TODO: Replace with actual API call
    // return this.http.get<Lesson>(`${environment.apiUrl}/lessons/${id}`);
    return of(MOCK_LESSONS.find(l => l.id === id));
  }

  // Filter lessons by subject
  getLessonsBySubject(subject: string): Observable<Lesson[]> {
    const filtered = MOCK_LESSONS.filter(l =>
      l.subject.toLowerCase() === subject.toLowerCase()
    );
    return of(filtered);
  }

  // Filter lessons by difficulty
  getLessonsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Observable<Lesson[]> {
    const filtered = MOCK_LESSONS.filter(l => l.difficulty === difficulty);
    return of(filtered);
  }

  // Start a lesson and initialize progress
  startLesson(lessonId: string): void {
    const lesson = MOCK_LESSONS.find(l => l.id === lessonId);
    if (lesson && lesson.contentBlocks.length > 0) {
      const progress: LessonProgress = {
        lessonId,
        currentBlockId: lesson.contentBlocks[0].id,
        completedBlocks: [],
        startedAt: new Date(),
        lastUpdated: new Date(),
        emotionHistory: []
      };
      this.currentProgressSubject.next(progress);
    }
  }

  // Update current progress
  updateProgress(progress: LessonProgress): void {
    progress.lastUpdated = new Date();
    this.currentProgressSubject.next(progress);
  }

  // Mark a content block as completed
  completeBlock(blockId: string): void {
    const currentProgress = this.currentProgressSubject.value;
    if (currentProgress && !currentProgress.completedBlocks.includes(blockId)) {
      currentProgress.completedBlocks.push(blockId);
      this.updateProgress(currentProgress);
    }
  }

  // Move to next content block
  moveToNextBlock(lessonId: string, currentBlockId: string): void {
    const lesson = MOCK_LESSONS.find(l => l.id === lessonId);
    const currentProgress = this.currentProgressSubject.value;

    if (lesson && currentProgress) {
      const currentIndex = lesson.contentBlocks.findIndex(b => b.id === currentBlockId);
      if (currentIndex < lesson.contentBlocks.length - 1) {
        currentProgress.currentBlockId = lesson.contentBlocks[currentIndex + 1].id;
        this.updateProgress(currentProgress);
      }
    }
  }

  // Get current progress
  getCurrentProgress(): LessonProgress | null {
    return this.currentProgressSubject.value;
  }

  // Clear progress (end lesson)
  clearProgress(): void {
    this.currentProgressSubject.next(null);
  }
}
