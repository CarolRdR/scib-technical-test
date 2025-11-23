import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { ExcelCandidateParserService } from '../../../../core/services/excel/excel-candidate-parser.service';
import { NotificationService } from '../../../../shared/services/notification.service';
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
  let excelParserSpy: jasmine.SpyObj<ExcelCandidateParserService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('CandidateApiService', ['uploadCandidate', 'listCandidates']);
    storageMock = new CandidateStorageMock();
    excelParserSpy = jasmine.createSpyObj('ExcelCandidateParserService', ['parseCandidateFile']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    apiServiceSpy.listCandidates.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UploadCandidateComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
        { provide: CandidateApiService, useValue: apiServiceSpy },
        { provide: CandidateStorageService, useValue: storageMock },
        { provide: ExcelCandidateParserService, useValue: excelParserSpy },
        { provide: NotificationService, useValue: notificationSpy }
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

  it('should prepare payload by normalizing file through parser', async () => {
    const rawFile = new File(['raw'], 'raw.xlsx');
    const normalizedFile = new File(['normalized'], 'normalized.xlsx');
    component.uploadForm.controls.name.setValue('John');
    component.uploadForm.controls.surname.setValue('Doe');
    component.uploadForm.controls.file.setValue(rawFile);

    excelParserSpy.parseCandidateFile.and.returnValue(
      Promise.resolve({
        excelData: { seniority: 'junior', years: 1, availability: true },
        normalizedFile
      })
    );

    const payload = await (component as any).preparePayload();

    expect(payload).toEqual({ name: 'John', surname: 'Doe', file: normalizedFile });
    expect(excelParserSpy.parseCandidateFile).toHaveBeenCalledWith(rawFile);
  });

  it('should persist candidate, update storage and reset form', async () => {
    const normalizedFile = new File(['normalized'], 'normalized.xlsx');
    const payload = { name: 'John', surname: 'Doe', file: normalizedFile };
    const response: Candidate = {
      name: 'John',
      surname: 'Doe',
      seniority: 'junior',
      years: 3,
      availability: true
    };
    const notifySpy = spyOn(component as any, 'notifySuccess');
    component.uploadForm.controls.name.setValue('Initial');
    component.uploadForm.controls.surname.setValue('Value');
    component.uploadForm.controls.file.setValue(normalizedFile);
    apiServiceSpy.uploadCandidate.and.returnValue(of(response));

    await (component as any).persistCandidate(payload);

    expect(apiServiceSpy.uploadCandidate).toHaveBeenCalledWith(payload);
    expect(storageMock.addCandidate).toHaveBeenCalledWith(response);
    expect(component.uploadForm.controls.name.value).toBe('');
    expect(component.uploadForm.controls.surname.value).toBe('');
    expect(component.uploadForm.controls.file.value).toBeNull();
    expect(notifySpy).toHaveBeenCalledWith(response);
  });

  it('should notify success using notification service', () => {
    const candidate: Candidate = {
      name: 'Jane',
      surname: 'Doe',
      seniority: 'senior',
      years: 5,
      availability: true
    };

    (component as any).notifySuccess(candidate);

    expect(notificationSpy.showSuccess).toHaveBeenCalledWith('UPLOAD_CANDIDATE.SNACKBAR_SUCCESS', {
      name: candidate.name,
      surname: candidate.surname
    });
  });
});
