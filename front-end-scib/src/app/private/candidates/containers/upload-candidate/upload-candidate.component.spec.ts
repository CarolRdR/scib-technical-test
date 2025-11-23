import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { CandidateApiService } from '../../services/api/candidate-api.service';
import { ExcelCandidateParserService } from '../../services/excel/excel-candidate-parser.service';
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
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let excelParserSpy: jasmine.SpyObj<ExcelCandidateParserService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('CandidateApiService', ['uploadCandidate', 'listCandidates']);
    storageMock = new CandidateStorageMock();
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    excelParserSpy = jasmine.createSpyObj('ExcelCandidateParserService', ['parseCandidateFile']);
    apiServiceSpy.listCandidates.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UploadCandidateComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
        { provide: CandidateApiService, useValue: apiServiceSpy },
        { provide: CandidateStorageService, useValue: storageMock },
        { provide: ExcelCandidateParserService, useValue: excelParserSpy }
      ]
    })
      .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
      .compileComponents();

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
    const apiResponse: Candidate = { seniority: 'junior', years: 2, availability: true, name: 'John', surname: 'Doe' };

    component.uploadForm.controls.name.setValue('John');
    component.uploadForm.controls.surname.setValue('Doe');
    component.uploadForm.controls.file.setValue(file);

    excelParserSpy.parseCandidateFile.and.returnValue(
      Promise.resolve({
        excelData: { seniority: 'junior', years: 2, availability: true },
        normalizedFile: file
      })
    );
    const notifySpy = spyOn(component as any, 'notifySuccess');
    apiServiceSpy.uploadCandidate.and.returnValue(of(apiResponse));

    await component.onSubmit();

    expect(apiServiceSpy.uploadCandidate).toHaveBeenCalled();
    expect(storageMock.setLoading).toHaveBeenCalledWith(true);
    expect(storageMock.addCandidate).toHaveBeenCalledWith(apiResponse);
    expect(component.uploadForm.controls.name.value).toBe('');
    expect(component.uploadForm.controls.file.value).toBeNull();
    expect(excelParserSpy.parseCandidateFile).toHaveBeenCalledWith(file);
    expect(notifySpy).toHaveBeenCalledWith(apiResponse);
  });

  it('should present error if parser fails', async () => {
    const file = new File(['content'], 'candidate.xlsx');
    component.uploadForm.controls.name.setValue('John');
    component.uploadForm.controls.surname.setValue('Doe');
    component.uploadForm.controls.file.setValue(file);

    const parserError = new Error('parse failure');
    excelParserSpy.parseCandidateFile.and.returnValue(Promise.reject(parserError));
    const presentErrorSpy = spyOn(component as any, 'presentError');

    await component.onSubmit();

    expect(apiServiceSpy.uploadCandidate).not.toHaveBeenCalled();
    expect(presentErrorSpy).toHaveBeenCalledWith(parserError);
  });

  it('should notify success using translated snackbar', () => {
    const translate = TestBed.inject(TranslateService);
    const candidate: Candidate = {
      name: 'Jane',
      surname: 'Doe',
      seniority: 'senior',
      years: 5,
      availability: true
    };

    (component as any).notifySuccess(candidate);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      translate.instant('UPLOAD_CANDIDATE.SNACKBAR_SUCCESS', {
        name: candidate.name,
        surname: candidate.surname
      }),
      translate.instant('COMMON.CLOSE'),
      {
        duration: 3000,
        panelClass: ['snackbar-success']
      }
    );
  });
});
