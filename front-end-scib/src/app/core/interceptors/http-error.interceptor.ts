import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { BACKEND_ERROR_MESSAGE_MAP, ERROR_MESSAGES } from '../constants/error-messages';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const backendMessage =
          (typeof error.error === 'object' ? error.error?.message : error.error) ?? '';
        const friendlyMessage =
          BACKEND_ERROR_MESSAGE_MAP[String(backendMessage)] ?? ERROR_MESSAGES.general.unknown;
        snackBar.open(friendlyMessage, 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }

      return throwError(() => error);
    })
  );
};
