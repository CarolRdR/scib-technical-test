import { Component, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslateModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly translate = inject(TranslateService);

  protected readonly availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];

  protected readonly selectedLanguage = signal(this.resolveInitialLanguage());

  protected onLanguageChange(lang: string): void {
    this.translate.use(lang);
    this.selectedLanguage.set(lang);
  }

  private resolveInitialLanguage(): string {
    const current = this.translate.getCurrentLang();
    if (current) {
      return current;
    }
    const browserLang = this.translate.getBrowserLang() ? this.translate.getBrowserLang() : 'es';
    return browserLang && browserLang.toLowerCase().startsWith('en') ? 'en' : 'es';
  }

}
