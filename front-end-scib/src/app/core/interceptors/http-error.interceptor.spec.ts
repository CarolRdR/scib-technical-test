import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule]
    });
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should show error snackbar on HttpErrorResponse', () => {
    const snackSpy = spyOn(snackBar, 'open');
    const req = new HttpRequest('GET', '/api/test');
    const next = () =>
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Availability must be a boolean' } }));

    TestBed.runInInjectionContext(() => {
      httpErrorInterceptor(req, next).subscribe({
        error: () => {
          expect(snackSpy).toHaveBeenCalled();
        }
      });
    });
  });
});
