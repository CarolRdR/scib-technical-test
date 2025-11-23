import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  @Input() public label = '';
  @Input() public placeholder = '';
  @Input() public value = '';
  @Input() public clearButtonAriaLabel = '';

  @Output() public readonly valueChange = new EventEmitter<string>();
  @Output() public readonly clear = new EventEmitter<void>();

  // Emits the new value on every keyboard input.
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.valueChange.emit(target?.value ? target?.value  : '');
  }

  // Notifies listeners that the search input must be cleared.
  protected onClear(): void {
    this.clear.emit();
  }
}
