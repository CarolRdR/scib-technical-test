import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MATERIAL_IMPORTS } from '../../imports/material.imports';

@Component({
  selector: 'app-drop-files-zone',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './drop-files-zone.html',
  styleUrl: './drop-files-zone.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class DropFilesZoneComponent implements OnInit, OnDestroy {
  @Input({ required: true }) control!: FormControl<File | null>;

  @ViewChild('fileInput', { static: false })
  private readonly fileInput?: ElementRef<HTMLInputElement>;

  protected isHovering = false;
  private readonly subscriptions = new Subscription();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('DropFilesZoneComponent requires a FormControl input.');
    }

    this.subscriptions.add(
      this.control.valueChanges.subscribe((file) => {
        if (!file) {
          this.clearInput();
        }
        this.cdr.markForCheck();
      })
    );

    this.subscriptions.add(
      this.control.statusChanges?.subscribe(() => {
        this.cdr.markForCheck();
      }) ?? new Subscription()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected get selectedFileName(): string {
    return this.control?.value?.name ?? '';
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

  protected onClickDropzone(): void {
    this.control?.markAsTouched();
    this.cdr.markForCheck();
    this.fileInput?.nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = true;
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = false;
  }

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

  private setFile(file: File): void {
    if (!this.control) {
      return;
    }

    this.control.setValue(file);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.control.updateValueAndValidity();
  }

  private clearInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
