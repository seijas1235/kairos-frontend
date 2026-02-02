import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageSelector } from '../language-selector/language-selector';
import { I18nService } from '../../../core/services/i18n';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSelector],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  i18n = inject(I18nService);
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
