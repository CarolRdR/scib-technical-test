import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DropFilesZoneComponent } from './drop-files-zone';

describe('DropFilesZoneComponent', () => {
  let component: DropFilesZoneComponent;
  let fixture: ComponentFixture<DropFilesZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropFilesZoneComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DropFilesZoneComponent);
    component = fixture.componentInstance;
    component.control = new FormControl<File | null>(null);
    fixture.detectChanges();
  });

  it('should create with required control input', () => {
    expect(component).toBeTruthy();
    expect(component.control).toBeDefined();
  });

  it('should update control when a file is selected', () => {
    const file = new File(['content'], 'candidate.xlsx');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: {
        item: () => file,
        length: 1,
        0: file
      },
      writable: false
    });

    (component as any).onFileSelected({ target: input } as unknown as Event);
    expect(component.control.value).toBe(file);
  });

  it('should mark control as touched and dirty when dropping a file', () => {
    const file = new File(['content'], 'candidate.xlsx');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const dropEvent = new DragEvent('drop', { dataTransfer });
    (component as any).onDrop(dropEvent);

    expect(component.control.value).toBe(file);
    expect(component.control.touched).toBeTrue();
    expect(component.control.dirty).toBeTrue();
  });

  it('should clear the selected file when clicking remove button handler', () => {
    const file = new File(['content'], 'candidate.xlsx');
    component['setFile'](file);
    (component as any).onClearSelectedFile(new Event('click'));

    expect(component.control.value).toBeNull();
    expect(component.control.touched).toBeTrue();
  });
});
