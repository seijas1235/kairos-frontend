import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LessonService } from '../../core/services/lesson';

@Component({
    selector: 'app-lesson-creator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './lesson-creator.html',
    styleUrls: ['./lesson-creator.scss']
})
export class LessonCreator {
    // Form fields
    topic = signal('');
    level = signal<'beginner' | 'intermediate' | 'advanced'>('beginner');
    learningStyle = signal<'visual' | 'textual' | 'interactive' | 'mixed'>('mixed');
    age = signal<number | null>(null);

    // UI state
    isGenerating = signal(false);
    error = signal<string | null>(null);

    // Dropdown options
    levels: Array<{ value: 'beginner' | 'intermediate' | 'advanced', label: string, icon: string, description: string }> = [
        { value: 'beginner', label: 'Beginner', icon: '🌱', description: 'New to this topic' },
        { value: 'intermediate', label: 'Intermediate', icon: '📚', description: 'Some knowledge' },
        { value: 'advanced', label: 'Advanced', icon: '🎓', description: 'Deep understanding' }
    ];

    styles: Array<{ value: 'visual' | 'textual' | 'interactive' | 'mixed', label: string, icon: string, description: string }> = [
        { value: 'visual', label: 'Visual', icon: '👁️', description: 'Diagrams and images' },
        { value: 'textual', label: 'Textual', icon: '📝', description: 'Written explanations' },
        { value: 'interactive', label: 'Interactive', icon: '🎮', description: 'Hands-on practice' },
        { value: 'mixed', label: 'Mixed', icon: '🎨', description: 'Balanced approach' }
    ];

    constructor(
        private lessonService: LessonService,
        private router: Router
    ) { }

    async generateLesson(): Promise<void> {
        // Validate topic
        if (!this.topic().trim()) {
            this.error.set('Please enter a topic you want to learn');
            return;
        }

        this.error.set(null);
        this.isGenerating.set(true);

        try {
            console.log('Generating lesson:', {
                topic: this.topic(),
                level: this.level(),
                learningStyle: this.learningStyle(),
                age: this.age()
            });

            // Call lesson service to generate lesson
            const lesson = await this.lessonService.generateLesson({
                topic: this.topic(),
                level: this.level(),
                learning_style: this.learningStyle(),
                age: this.age() || undefined
            });

            console.log('Lesson generated:', lesson);

            // Navigate to learning session with generated lesson
            this.router.navigate(['/lesson', lesson.lesson_id]);

        } catch (error: any) {
            console.error('Error generating lesson:', error);
            this.error.set(error.message || 'Failed to generate lesson. Please try again.');
        } finally {
            this.isGenerating.set(false);
        }
    }

    // Example topics for quick start
    exampleTopics = [
        { topic: 'Quantum Physics', level: 'beginner', icon: '⚛️' },
        { topic: 'Machine Learning', level: 'intermediate', icon: '🤖' },
        { topic: 'Ancient Rome', level: 'beginner', icon: '🏛️' },
        { topic: 'Climate Change', level: 'intermediate', icon: '🌍' },
        { topic: 'Photography Basics', level: 'beginner', icon: '📸' },
        { topic: 'Blockchain Technology', level: 'advanced', icon: '⛓️' }
    ];

    selectExample(example: any): void {
        this.topic.set(example.topic);
        this.level.set(example.level);
    }
}
