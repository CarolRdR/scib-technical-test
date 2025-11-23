import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HeaderComponent } from './header';

describe('Header', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose english and spanish languages', () => {
    const codes = component['availableLanguages'].map((lang) => lang.code);
    expect(codes).toContain('en');
    expect(codes).toContain('es');
  });

  it('should update translate service when changing language', () => {
    const translate = TestBed.inject(TranslateService);
    const useSpy = spyOn(translate, 'use').and.returnValue(of({}));

    (component as any).onLanguageChange('en');

    expect(useSpy).toHaveBeenCalledWith('en');
    expect((component as any).selectedLanguage()).toBe('en');
  });
});
