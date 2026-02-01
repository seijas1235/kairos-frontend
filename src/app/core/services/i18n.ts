import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'es' | 'pt';

interface Translations {
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    private translations: Record<Language, Translations> = {
        en: {},
        es: {},
        pt: {}
    };

    currentLang = signal<Language>('en');

    constructor() {
        // Load translations
        this.loadTranslations();

        // Load saved language from localStorage
        const savedLang = localStorage.getItem('kairos_language') as Language;
        if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
            this.currentLang.set(savedLang);
        }

        // Save language changes to localStorage
        effect(() => {
            localStorage.setItem('kairos_language', this.currentLang());
        });
    }

    private async loadTranslations(): Promise<void> {
        try {
            const [en, es, pt] = await Promise.all([
                fetch('/assets/i18n/en.json').then(r => r.json()),
                fetch('/assets/i18n/es.json').then(r => r.json()),
                fetch('/assets/i18n/pt.json').then(r => r.json())
            ]);

            this.translations.en = en;
            this.translations.es = es;
            this.translations.pt = pt;
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    /**
     * Translate a key to the current language
     * @param key - Translation key (e.g., 'home.hero.title')
     * @param params - Optional parameters for interpolation
     */
    t(key: string, params?: Record<string, any>): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLang()];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Replace parameters if provided
        if (params) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{{${param}}}`, params[param]);
            });
        }

        return value;
    }

    /**
     * Set the current language
     */
    setLanguage(lang: Language): void {
        this.currentLang.set(lang);
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): Array<{ code: Language, name: string, flag: string }> {
        return [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'pt', name: 'Português', flag: '🇧🇷' }
        ];
    }
}
