import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(private readonly translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    const browserLang = this.translate.getBrowserLang() ?? 'es';
    const normalizedLang = browserLang.startsWith('en') ? 'en' : 'es';
    this.translate.setFallbackLang('en');
    this.translate.use(normalizedLang);
  }
}
