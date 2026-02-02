import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  Lesson,
  LessonProgress,
  GenerateLessonRequest,
  GenerateLessonResponse,
  ContinueLessonRequest,
  ContinueLessonResponse,
  AdaptMessageRequest,
  AdaptMessageResponse,
  Topic,
  Message
} from '../models/lesson.model';
import { environment } from '../../../environments/environment';
import { LessonStorageService } from './lesson-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private http = inject(HttpClient);
  private storage = inject(LessonStorageService);

  private currentProgressSubject = new BehaviorSubject<LessonProgress | null>(null);
  public currentProgress$ = this.currentProgressSubject.asObservable();

  constructor() { }

  /**
   * Get all available lessons from localStorage
   */
  getAllLessons(): Observable<Lesson[]> {
    return of(this.storage.getAllLessons());
  }

  /**
   * Get a specific lesson by ID
   */
  getLessonById(id: string): Observable<Lesson | undefined> {
    const lesson = this.storage.getLesson(id);
    return of(lesson || undefined);
  }

  /**
   * Generate a new lesson using AI with dynamic curriculum
   */
  async generateLesson(params: GenerateLessonRequest): Promise<Lesson> {
    try {
      // Get completed topics to avoid repetition
      const excludedTopics = this.storage.getCompletedTopics(params.topic);

      const requestBody = {
        ...params,
        excluded_topics: excludedTopics
      };

      const response = await firstValueFrom(
        this.http.post<GenerateLessonResponse>(`${environment.apiUrl}/lessons/generate/`, requestBody)
      );

      // Transform the response to match our Lesson model
      const transformedLesson: Lesson = {
        id: response.lesson_id,
        title: response.title,
        subject: params.topic,
        difficulty: response.difficulty_level as any || params.level,
        description: response.description,
        estimatedMinutes: response.estimated_duration_minutes || 30,
        objectives: response.objectives || [],

        // New curriculum structure
        curriculum: {
          totalTopics: response.curriculum.total_topics,
          currentTopicIndex: 0,
          topics: response.curriculum.topics.map(topic => ({
            id: topic.id,
            title: topic.title,
            order: topic.order,
            completed: false,
            messages: topic.messages.map((msg, idx) => ({
              id: `${topic.id}_msg_${idx}`,
              type: msg.type as any,
              content: msg.content,
              requiresResponse: msg.requires_response,
              timestamp: new Date()
            }))
          }))
        },

        metadata: {
          ...response.metadata,
          alias: params.alias
        },

        sessionHistory: [],
        thumbnailUrl: `https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(params.topic)}`
      };

      // Store the lesson
      this.storage.saveLesson(transformedLesson);

      return transformedLesson;
    } catch (error) {
      console.error('Error generating lesson:', error);
      throw error;
    }
  }

  /**
   * Generate additional topics to continue a lesson
   */
  async continueLesson(lesson: Lesson, numTopics: number = 6): Promise<Topic[]> {
    try {
      const request: ContinueLessonRequest = {
        lesson,
        numTopics
      };

      const response = await firstValueFrom(
        this.http.post<ContinueLessonResponse>(`${environment.apiUrl}/lessons/continue/`, request)
      );

      // Transform and add IDs to messages
      const newTopics: Topic[] = response.topics.map(topic => ({
        ...topic,
        completed: false,
        messages: topic.messages.map((msg, idx) => ({
          ...msg,
          id: `${topic.id}_msg_${idx}`,
          timestamp: new Date()
        }))
      }));

      // Update lesson with new topics
      if (lesson.curriculum) {
        lesson.curriculum.topics.push(...newTopics);
        lesson.curriculum.totalTopics = lesson.curriculum.topics.length;
        this.storage.saveLesson(lesson);
      }

      return newTopics;
    } catch (error) {
      console.error('Error continuing lesson:', error);
      throw error;
    }
  }

  /**
   * Adapt a message based on student emotion
   */
  async adaptMessage(message: Message, emotion: string, studentContext: any = {}): Promise<Message> {
    try {
      const request: AdaptMessageRequest = {
        message,
        emotion,
        studentContext
      };

      const response = await firstValueFrom(
        this.http.post<AdaptMessageResponse>(`${environment.apiUrl}/lessons/adapt-message/`, request)
      );

      return response;
    } catch (error) {
      console.error('Error adapting message:', error);
      // Return original message if adaptation fails
      return message;
    }
  }

  /**
   * Filter lessons by subject
   */
  getLessonsBySubject(subject: string): Observable<Lesson[]> {
    const lessons = this.storage.getAllLessons();
    const filtered = lessons.filter(l =>
      l.subject.toLowerCase() === subject.toLowerCase()
    );
    return of(filtered);
  }

  /**
   * Filter lessons by difficulty
   */
  getLessonsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Observable<Lesson[]> {
    const lessons = this.storage.getAllLessons();
    const filtered = lessons.filter(l => l.difficulty === difficulty);
    return of(filtered);
  }

  /**
   * Start a lesson and initialize progress
   */
  startLesson(lessonId: string): void {
    const lesson = this.storage.getLesson(lessonId);
    if (!lesson) return;

    let progress: LessonProgress;

    if (lesson.curriculum) {
      // New curriculum-based lesson
      progress = {
        lessonId,
        currentTopicIndex: 0,
        currentMessageIndex: 0,
        completedTopics: [],
        startedAt: new Date(),
        lastUpdated: new Date(),
        emotionHistory: []
      };
    } else if (lesson.contentBlocks && lesson.contentBlocks.length > 0) {
      // Legacy block-based lesson
      progress = {
        lessonId,
        currentBlockId: lesson.contentBlocks[0].id,
        completedBlocks: [],
        startedAt: new Date(),
        lastUpdated: new Date(),
        emotionHistory: []
      };
    } else {
      return;
    }

    this.currentProgressSubject.next(progress);
    this.storage.saveLessonProgress(progress);
  }

  /**
   * Update current progress
   */
  updateProgress(progress: LessonProgress): void {
    progress.lastUpdated = new Date();
    this.currentProgressSubject.next(progress);
    this.storage.saveLessonProgress(progress);
  }

  /**
   * Move to next message in current topic
   */
  moveToNextMessage(lessonId: string): boolean {
    const lesson = this.storage.getLesson(lessonId);
    const currentProgress = this.currentProgressSubject.value;

    if (!lesson || !lesson.curriculum || !currentProgress) return false;

    const currentTopic = lesson.curriculum.topics[currentProgress.currentTopicIndex || 0];
    if (!currentTopic) return false;

    const currentMessageIndex = currentProgress.currentMessageIndex || 0;

    // Check if there are more messages in current topic
    if (currentMessageIndex < currentTopic.messages.length - 1) {
      currentProgress.currentMessageIndex = currentMessageIndex + 1;
      this.updateProgress(currentProgress);
      return true;
    }

    return false;
  }

  /**
   * Move to next topic
   */
  moveToNextTopic(lessonId: string): boolean {
    const lesson = this.storage.getLesson(lessonId);
    const currentProgress = this.currentProgressSubject.value;

    if (!lesson || !lesson.curriculum || !currentProgress) return false;

    const currentTopicIndex = currentProgress.currentTopicIndex || 0;
    const currentTopic = lesson.curriculum.topics[currentTopicIndex];

    // Mark current topic as completed
    if (currentTopic && !currentProgress.completedTopics?.includes(currentTopic.id)) {
      if (!currentProgress.completedTopics) {
        currentProgress.completedTopics = [];
      }
      currentProgress.completedTopics.push(currentTopic.id);
      currentTopic.completed = true;
    }

    // Check if there are more topics
    if (currentTopicIndex < lesson.curriculum.topics.length - 1) {
      currentProgress.currentTopicIndex = currentTopicIndex + 1;
      currentProgress.currentMessageIndex = 0;
      this.updateProgress(currentProgress);
      this.storage.saveLesson(lesson);
      return true;
    }

    return false;
  }

  /**
   * Complete the current lesson
   */
  completeLesson(lessonId: string): void {
    this.storage.markLessonAsCompleted(lessonId);
    this.clearProgress();
  }

  /**
   * Get current progress
   */
  getCurrentProgress(): LessonProgress | null {
    return this.currentProgressSubject.value;
  }

  /**
   * Clear progress (end lesson)
   */
  clearProgress(): void {
    this.currentProgressSubject.next(null);
  }

  /**
   * Delete a lesson
   */
  deleteLesson(lessonId: string): void {
    this.storage.deleteLesson(lessonId);
  }

  // ===== Legacy methods for backward compatibility =====

  /**
   * Mark a content block as completed (legacy)
   */
  completeBlock(blockId: string): void {
    const currentProgress = this.currentProgressSubject.value;
    if (currentProgress && currentProgress.completedBlocks && !currentProgress.completedBlocks.includes(blockId)) {
      currentProgress.completedBlocks.push(blockId);
      this.updateProgress(currentProgress);
    }
  }

  /**
   * Move to next content block (legacy)
   */
  moveToNextBlock(lessonId: string, currentBlockId: string): void {
    const lesson = this.storage.getLesson(lessonId);
    const currentProgress = this.currentProgressSubject.value;

    if (lesson && lesson.contentBlocks && currentProgress) {
      const currentIndex = lesson.contentBlocks.findIndex(b => b.id === currentBlockId);
      if (currentIndex < lesson.contentBlocks.length - 1) {
        currentProgress.currentBlockId = lesson.contentBlocks[currentIndex + 1].id;
        this.updateProgress(currentProgress);
      }
    }
  }
}
