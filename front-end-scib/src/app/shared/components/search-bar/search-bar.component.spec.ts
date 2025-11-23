import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit valueChange when typing in the input', () => {
    const emitted: string[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'John';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['John']);
  });

  it('should emit clear event when clicking the clear button', () => {
    const clearSpy = jasmine.createSpy('clearSpy');
    component.clear.subscribe(() => clearSpy());
    fixture.componentRef.setInput('value', 'Sample');
    fixture.componentRef.setInput('clearButtonAriaLabel', 'Clear text');
    fixture.detectChanges();

    const button: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[mat-icon-button]');
    expect(button).toBeTruthy();

    button!.click();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
