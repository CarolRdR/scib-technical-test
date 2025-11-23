import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-drop-files-zone',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, MatIconModule, MatButtonModule],
  templateUrl: './drop-files-zone.html',
  styleUrl: './drop-files-zone.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class DropFilesZoneComponent {
  @Input({ required: true })
  set control(value: FormControl<File | null>) {
    if (!value) {
      throw new Error('DropFilesZoneComponent requires a FormControl input.');
    }
    this.controlRef = value;
    this.initializeControlListeners();
  }

  get control(): FormControl<File | null> {
    return this.controlRef;
  }

  @ViewChild('fileInput', { static: false })
  private readonly fileInput?: ElementRef<HTMLInputElement>;

  private controlRef!: FormControl<File | null>;
  protected isHovering: boolean = false;

  constructor(private readonly cdr: ChangeDetectorRef, private readonly destroyRef: DestroyRef) {}


  protected get selectedFileName(): string {
    const name = this.control?.value?.name;
    return name ? name : '';
  }

  protected get hasSelectedFile(): boolean {
    return Boolean(this.control?.value);
  }

  protected get showRequiredError(): boolean {
    if (!this.control) {
      return false;
    }
    return this.control.invalid && this.control.touched;
  }

  // Focuses the hidden input without triggering validation yet.
  protected onClickDropzone(): void {
    this.fileInput?.nativeElement.click();
  }

  // Handles drag over to provide visual feedback.
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = true;
  }

  // Clears hover feedback when the dragged file leaves the zone.
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = false;
  }

  // Accepts the dropped file and propagates it to the form control.
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = false;

    const files = event.dataTransfer?.files;
    if (!files?.length) {
      this.control?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.setFile(files[0]);
  }

  // Handles manual file selection via the native input.
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      this.control?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.setFile(file);
    this.clearInput();
  }

  // Allows users to clear the current file without selecting another.
  protected onClearSelectedFile(event: Event): void {
    event.stopPropagation();
    if (!this.control) {
      return;
    }
    this.control.setValue(null);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.control.updateValueAndValidity();
    this.clearInput();
    this.cdr.markForCheck();
  }

  // Updates the FormControl with a new file and syncs validation state.
  private setFile(file: File): void {
    if (!this.control) {
      return;
    }

    this.control.setValue(file);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.control.updateValueAndValidity();
  }

  // Resets the hidden input value to allow re-selecting the same file.
  private clearInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Subscribes to control changes to reset the input and trigger change detection.
  private initializeControlListeners(): void {
    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((file) => {
      if (!file) {
        this.clearInput();
      }
      this.cdr.markForCheck();
    });

    this.control.statusChanges
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }
}
