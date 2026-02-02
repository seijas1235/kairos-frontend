import { Injectable } from '@angular/core';
import { Lesson, LessonProgress, Topic } from '../models/lesson.model';

/**
 * Service for persisting lesson data in localStorage
 * Handles lesson progress, completed topics, and session history
 */
@Injectable({
    providedIn: 'root'
})
export class LessonStorageService {

    private readonly LESSON_PREFIX = 'kairos_lesson_';
    private readonly PROGRESS_PREFIX = 'kairos_progress_';
    private readonly COMPLETED_TOPICS_KEY = 'kairos_completed_topics';
    private readonly MAX_STORAGE_DAYS = 30;

    constructor() {
        this.cleanOldLessons();
    }

    /**
     * Save lesson data to localStorage
     */
    saveLesson(lesson: Lesson): void {
        try {
            const key = `${this.LESSON_PREFIX}${lesson.id}`;
            const data = {
                lesson,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving lesson to localStorage:', error);
        }
    }

    /**
     * Get lesson data from localStorage
     */
    getLesson(lessonId: string): Lesson | null {
        try {
            const key = `${this.LESSON_PREFIX}${lessonId}`;
            const data = localStorage.getItem(key);
            if (!data) return null;

            const parsed = JSON.parse(data);
            return parsed.lesson;
        } catch (error) {
            console.error('Error loading lesson from localStorage:', error);
            return null;
        }
    }

    /**
     * Save lesson progress
     */
    saveLessonProgress(progress: LessonProgress): void {
        try {
            const key = `${this.PROGRESS_PREFIX}${progress.lessonId}`;
            localStorage.setItem(key, JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving lesson progress:', error);
        }
    }

    /**
     * Get lesson progress
     */
    getLessonProgress(lessonId: string): LessonProgress | null {
        try {
            const key = `${this.PROGRESS_PREFIX}${lessonId}`;
            const data = localStorage.getItem(key);
            if (!data) return null;

            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading lesson progress:', error);
            return null;
        }
    }

    /**
     * Get all lessons from localStorage
     */
    getAllLessons(): Lesson[] {
        const lessons: Lesson[] = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.LESSON_PREFIX)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        lessons.push(parsed.lesson);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading all lessons:', error);
        }

        return lessons;
    }

    /**
     * Get completed topics for a specific subject to avoid repetition
     */
    getCompletedTopics(subject: string): string[] {
        try {
            const data = localStorage.getItem(this.COMPLETED_TOPICS_KEY);
            if (!data) return [];

            const allCompleted = JSON.parse(data);
            return allCompleted[subject] || [];
        } catch (error) {
            console.error('Error loading completed topics:', error);
            return [];
        }
    }

    /**
     * Mark topics as completed for a subject
     */
    markTopicsCompleted(subject: string, topicTitles: string[]): void {
        try {
            const data = localStorage.getItem(this.COMPLETED_TOPICS_KEY);
            const allCompleted = data ? JSON.parse(data) : {};

            if (!allCompleted[subject]) {
                allCompleted[subject] = [];
            }

            // Add new topics, avoiding duplicates
            topicTitles.forEach(title => {
                if (!allCompleted[subject].includes(title)) {
                    allCompleted[subject].push(title);
                }
            });

            localStorage.setItem(this.COMPLETED_TOPICS_KEY, JSON.stringify(allCompleted));
        } catch (error) {
            console.error('Error marking topics as completed:', error);
        }
    }

    /**
     * Mark a lesson as completed
     */
    markLessonAsCompleted(lessonId: string): void {
        const lesson = this.getLesson(lessonId);
        if (!lesson) return;

        // Update lesson
        lesson.completedAt = new Date();
        this.saveLesson(lesson);

        // Mark all topics as completed
        if (lesson.curriculum && lesson.subject) {
            const topicTitles = lesson.curriculum.topics.map(t => t.title);
            this.markTopicsCompleted(lesson.subject, topicTitles);
        }
    }

    /**
     * Delete a lesson and its progress
     */
    deleteLesson(lessonId: string): void {
        try {
            localStorage.removeItem(`${this.LESSON_PREFIX}${lessonId}`);
            localStorage.removeItem(`${this.PROGRESS_PREFIX}${lessonId}`);
        } catch (error) {
            console.error('Error deleting lesson:', error);
        }
    }

    /**
     * Clean up lessons older than MAX_STORAGE_DAYS
     */
    private cleanOldLessons(): void {
        try {
            const now = new Date().getTime();
            const maxAge = this.MAX_STORAGE_DAYS * 24 * 60 * 60 * 1000;

            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.LESSON_PREFIX)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        const savedAt = new Date(parsed.savedAt).getTime();

                        if (now - savedAt > maxAge) {
                            const lessonId = key.replace(this.LESSON_PREFIX, '');
                            this.deleteLesson(lessonId);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning old lessons:', error);
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats(): { used: number; total: number; percentage: number } {
        let used = 0;
        const total = 5 * 1024 * 1024; // 5MB typical localStorage limit

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        used += key.length + value.length;
                    }
                }
            }
        } catch (error) {
            console.error('Error calculating storage stats:', error);
        }

        return {
            used,
            total,
            percentage: (used / total) * 100
        };
    }

    /**
     * Clear all lesson data (for testing or reset)
     */
    clearAllLessons(): void {
        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(this.LESSON_PREFIX) || key.startsWith(this.PROGRESS_PREFIX))) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            localStorage.removeItem(this.COMPLETED_TOPICS_KEY);
        } catch (error) {
            console.error('Error clearing all lessons:', error);
        }
    }
}
