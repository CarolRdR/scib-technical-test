import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let translate: TranslateService;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: MatSnackBar, useValue: snackBarSpy }]
    });
    service = TestBed.inject(NotificationService);
    translate = TestBed.inject(TranslateService);
  });

  it('should show success snackbar with translated texts', () => {
    service.showSuccess('SUCCESS.KEY', { value: 'test' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      translate.instant('SUCCESS.KEY', { value: 'test' }),
      translate.instant('COMMON.CLOSE'),
      jasmine.objectContaining({ panelClass: ['snackbar-success'], duration: 3000 })
    );
  });

  it('should show error snackbar with translated texts', () => {
    service.showError('ERROR.KEY');

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      translate.instant('ERROR.KEY'),
      translate.instant('COMMON.CLOSE'),
      jasmine.objectContaining({ panelClass: ['snackbar-error'], duration: 4000 })
    );
  });
});
