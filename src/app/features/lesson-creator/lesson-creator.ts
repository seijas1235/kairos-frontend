import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LessonService } from '../../core/services/lesson';
import { RealTimeService } from '../../core/services/real-time.service';
import { UserPreferencesService } from '../../core/services/user-preferences';
import { I18nService } from '../../core/services/i18n';

@Component({
    selector: 'app-lesson-creator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './lesson-creator.html',
    styleUrls: ['./lesson-creator.scss']
})
export class LessonCreator {
    private lessonService = inject(LessonService);
    private realTimeService = inject(RealTimeService);
    private router = inject(Router);
    private userPrefs = inject(UserPreferencesService);
    i18n = inject(I18nService);

    // Form fields
    topic = signal('');
    level = signal<'beginner' | 'intermediate' | 'advanced'>('beginner');
    learningStyle = signal<'visual' | 'textual' | 'interactive' | 'mixed'>('mixed');
    age = signal<number | null>(null);
    alias = signal('');

    // UI state
    isGenerating = signal(false);
    error = signal('');

    // Options
    levels = [
        { value: 'beginner' as const, icon: '🌱' },
        { value: 'intermediate' as const, icon: '🌿' },
        { value: 'advanced' as const, icon: '🌳' }
    ];

    learningStyles = [
        { value: 'visual' as const, icon: '👁️' },
        { value: 'textual' as const, icon: '📝' },
        { value: 'interactive' as const, icon: '🎮' },
        { value: 'mixed' as const, icon: '🎨' }
    ];

    exampleTopics = [
        { key: 'quantumPhysics', icon: '⚛️' },
        { key: 'machineLearning', icon: '🤖' },
        { key: 'ancientRome', icon: '🏛️' },
        { key: 'climateChange', icon: '🌍' }
    ];

    constructor() {
        // Load saved alias
        this.alias.set(this.userPrefs.getAlias());
    }

    selectExample(example: { key: string; icon: string }): void {
        this.topic.set(this.i18n.t(`lessonCreator.examples.${example.key}`));
    }

    async generateLesson(): Promise<void> {
        // Validate
        if (!this.topic().trim()) {
            this.error.set(this.i18n.t('lessonCreator.error'));
            return;
        }

        this.isGenerating.set(true);
        this.error.set('');

        try {
            console.log('Generating lesson with params:', {
                topic: this.topic(),
                level: this.level(),
                learning_style: this.learningStyle(),
                age: this.age(),
                alias: this.alias()
            });

            // Save alias if provided
            if (this.alias().trim()) {
                this.userPrefs.setAlias(this.alias().trim());
            }

            // Call RealTimeService to start session directly
            const formData = {
                topic: this.topic(),
                level: this.level(), // Note: Backend expects 'difficulty' mapped from this
                difficulty: this.level(),
                style: this.learningStyle(),
                alias: this.alias().trim(),
                language: this.i18n.currentLang()
            };

            // Connect if not already (Service handles check)
            this.realTimeService.connect();

            // Send start_lesson payload
            this.realTimeService.startSession(formData);

            // Generate a temporary session ID for routing
            const tempLessonId = 'session-' + Date.now();

            // Navigate to learning session
            this.router.navigate(['/lesson', tempLessonId]);

        } catch (error: any) {
            console.error('Error starting session:', error);
            this.error.set(error.message || this.i18n.t('lessonCreator.error'));
        } finally {
            this.isGenerating.set(false);
        }
    }
}
