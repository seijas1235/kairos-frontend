import { Injectable, signal, effect } from '@angular/core';
import { I18nService, Language } from './i18n';

export interface UserPreferences {
    alias: string;
    language: Language;
    theme: 'light' | 'dark';
}

export interface LearningSession {
    id: string;
    lessonId: string;
    lessonTitle: string;
    topic: string;
    level: string;
    learningStyle: string;
    startedAt: string;
    completedAt?: string;
    durationMinutes: number;
    completionPercentage: number;
    emotionSummary: {
        engaged: number;
        confused: number;
        bored: number;
        neutral: number;
    };
    blocksCompleted: number;
    totalBlocks: number;
}

@Injectable({
    providedIn: 'root'
})
export class UserPreferencesService {
    private readonly PREFS_KEY = 'kairos_user_prefs';
    private readonly SESSIONS_KEY = 'kairos_sessions';

    preferences = signal<UserPreferences>({
        alias: '',
        language: 'en',
        theme: 'light'
    });

    sessions = signal<LearningSession[]>([]);

    constructor(private i18n: I18nService) {
        this.loadPreferences();
        this.loadSessions();

        // Save preferences when they change
        effect(() => {
            this.savePreferences();
        });
    }

    private loadPreferences(): void {
        const saved = localStorage.getItem(this.PREFS_KEY);
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                this.preferences.set(prefs);

                // Sync language with i18n service
                if (prefs.language) {
                    this.i18n.setLanguage(prefs.language);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
        }
    }

    private savePreferences(): void {
        localStorage.setItem(this.PREFS_KEY, JSON.stringify(this.preferences()));
    }

    private loadSessions(): void {
        const saved = localStorage.getItem(this.SESSIONS_KEY);
        if (saved) {
            try {
                const sessions = JSON.parse(saved);
                this.sessions.set(sessions);
            } catch (error) {
                console.error('Error loading sessions:', error);
            }
        }
    }

    private saveSessions(): void {
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.sessions()));
    }

    /**
     * Set user alias
     */
    setAlias(alias: string): void {
        this.preferences.update(prefs => ({ ...prefs, alias }));
    }

    /**
     * Set language
     */
    setLanguage(language: Language): void {
        this.preferences.update(prefs => ({ ...prefs, language }));
        this.i18n.setLanguage(language);
    }

    /**
     * Get user alias
     */
    getAlias(): string {
        return this.preferences().alias;
    }

    /**
     * Get personalized greeting
     */
    getGreeting(): string {
        const alias = this.getAlias();
        const greeting = this.i18n.t('learningSession.greeting.hello');

        if (alias) {
            return `${greeting} ${alias}!`;
        }
        return `${greeting}!`;
    }

    /**
     * Save a learning session
     */
    saveSession(session: LearningSession): void {
        const currentSessions = this.sessions();
        const existingIndex = currentSessions.findIndex(s => s.id === session.id);

        if (existingIndex >= 0) {
            // Update existing session
            currentSessions[existingIndex] = session;
            this.sessions.set([...currentSessions]);
        } else {
            // Add new session
            this.sessions.set([session, ...currentSessions]);
        }

        this.saveSessions();
    }

    /**
     * Get all sessions
     */
    getSessions(): LearningSession[] {
        return this.sessions();
    }

    /**
     * Get session by ID
     */
    getSession(id: string): LearningSession | undefined {
        return this.sessions().find(s => s.id === id);
    }

    /**
     * Delete a session
     */
    deleteSession(id: string): void {
        this.sessions.update(sessions => sessions.filter(s => s.id !== id));
        this.saveSessions();
    }

    /**
     * Clear all sessions
     */
    clearSessions(): void {
        this.sessions.set([]);
        this.saveSessions();
    }

    /**
     * Get learning statistics
     */
    getStats() {
        const sessions = this.sessions();
        const completed = sessions.filter(s => s.completionPercentage === 100);

        const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const avgEngagement = sessions.length > 0
            ? sessions.reduce((sum, s) => sum + s.emotionSummary.engaged, 0) / sessions.length
            : 0;

        return {
            totalLessons: sessions.length,
            hoursLearned: Math.round(totalMinutes / 60 * 10) / 10,
            avgEngagement: Math.round(avgEngagement),
            completionRate: sessions.length > 0
                ? Math.round((completed.length / sessions.length) * 100)
                : 0
        };
    }
}
