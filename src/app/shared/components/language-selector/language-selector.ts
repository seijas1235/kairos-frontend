import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../../core/services/i18n';
import { UserPreferencesService } from '../../../core/services/user-preferences';

@Component({
    selector: 'app-language-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './language-selector.html',
    styleUrls: ['./language-selector.scss']
})
export class LanguageSelector {
    i18n = inject(I18nService);
    userPrefs = inject(UserPreferencesService);

    languages = this.i18n.getAvailableLanguages();
    isOpen = false;

    toggleDropdown(): void {
        this.isOpen = !this.isOpen;
    }

    selectLanguage(lang: Language): void {
        this.userPrefs.setLanguage(lang);
        this.isOpen = false;
    }

    getCurrentLanguage() {
        return this.languages.find(l => l.code === this.i18n.currentLang());
    }
}
