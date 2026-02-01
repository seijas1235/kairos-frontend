import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, firstValueFrom } from 'rxjs';
import { Lesson, LessonProgress } from '../models/lesson.model';
import { MOCK_LESSONS } from './mock-data/mock-lessons';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private http = inject(HttpClient);
  private currentProgressSubject = new BehaviorSubject<LessonProgress | null>(null);
  public currentProgress$ = this.currentProgressSubject.asObservable();

  // Store for dynamically generated lessons
  private generatedLessons = new Map<string, any>();

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

  // Get a specific lesson by ID (checks generated lessons first)
  getLessonById(id: string): Observable<Lesson | undefined> {
    // Check if it's a generated lesson
    if (this.generatedLessons.has(id)) {
      return of(this.generatedLessons.get(id));
    }

    if (environment.useMockData) {
      const lesson = MOCK_LESSONS.find(l => l.id === id);
      return of(lesson);
    }
    // TODO: Replace with actual API call
    // return this.http.get<Lesson>(`${environment.apiUrl}/lessons/${id}`);
    return of(MOCK_LESSONS.find(l => l.id === id));
  }

  // Generate a new lesson using AI
  async generateLesson(params: {
    topic: string;
    level: string;
    learning_style: string;
    age?: number;
    alias?: string;
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/lessons/generate/`, params)
      );

      // Transform the response to match our Lesson model
      const transformedLesson = {
        id: response.lesson_id,
        title: response.title,
        subject: params.topic,
        difficulty: response.difficulty_level || params.level,
        description: response.description,
        duration: response.estimated_duration_minutes || 30,
        objectives: response.objectives || [],
        contentBlocks: response.content_blocks.map((block: any) => ({
          id: block.id,
          type: block.type,
          title: block.title,
          content: block.content,
          duration: block.duration_minutes || 5
        })),
        imageUrl: 'https://via.placeholder.com/300x200/667eea/ffffff?text=' + encodeURIComponent(params.topic),
        metadata: response.metadata
      };

      // Store the transformed lesson
      this.generatedLessons.set(response.lesson_id, transformedLesson);

      return transformedLesson;
    } catch (error) {
      console.error('Error generating lesson:', error);
      throw error;
    }
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
