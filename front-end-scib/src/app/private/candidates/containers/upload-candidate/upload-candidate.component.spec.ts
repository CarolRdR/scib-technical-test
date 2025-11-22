import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Candidate, CandidateExcelData } from '../../../../core/interfaces/candidate.interface';
import { CandidateApiService } from '../../services/api/candidate-api.service';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';
import { UploadCandidateComponent } from './upload-candidate.component';

class CandidateStorageMock {
  readonly candidates = jasmine.createSpy('candidates').and.returnValue([]);
  readonly isLoading = jasmine.createSpy('isLoading').and.returnValue(false);
  setLoading = jasmine.createSpy('setLoading');
  addCandidate = jasmine.createSpy('addCandidate');
  setCandidates = jasmine.createSpy('setCandidates');
}

describe('UploadCandidateComponent', () => {
  let component: UploadCandidateComponent;
  let fixture: ComponentFixture<UploadCandidateComponent>;
  let apiServiceSpy: jasmine.SpyObj<CandidateApiService>;
  let storageMock: CandidateStorageMock;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('CandidateApiService', ['uploadCandidate', 'listCandidates']);
    storageMock = new CandidateStorageMock();
    apiServiceSpy.listCandidates.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UploadCandidateComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
        { provide: CandidateApiService, useValue: apiServiceSpy },
        { provide: CandidateStorageService, useValue: storageMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(apiServiceSpy.uploadCandidate).not.toHaveBeenCalled();
  });

  it('should submit form and store candidate', async () => {
    const file = new File(['content'], 'candidate.xlsx');
    const excelData: CandidateExcelData = { seniority: 'junior', years: 2, availability: true };
    const apiResponse: Candidate = { ...excelData, name: 'John', surname: 'Doe' };

    component.uploadForm.controls.name.setValue('John');
    component.uploadForm.controls.surname.setValue('Doe');
    component.uploadForm.controls.file.setValue(file);

    spyOn(component as any, 'extractExcelRows').and.returnValue(Promise.resolve([excelData]));
    spyOn(component as any, 'normalizeExcelFile').and.returnValue(file);
    apiServiceSpy.uploadCandidate.and.returnValue(of(apiResponse));

    await component.onSubmit();

    expect(apiServiceSpy.uploadCandidate).toHaveBeenCalled();
    expect(storageMock.setLoading).toHaveBeenCalledWith(true);
    expect(storageMock.addCandidate).toHaveBeenCalledWith(apiResponse);
    expect(component.uploadForm.controls.name.value).toBe('');
    expect(component.uploadForm.controls.file.value).toBeNull();
  });
});
