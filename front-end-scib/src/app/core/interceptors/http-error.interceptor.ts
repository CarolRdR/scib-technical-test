import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { BACKEND_ERROR_MESSAGE_KEYS_MAP, ERROR_MESSAGE_KEYS } from '../constants/error-messages';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const backendMessage =
          (typeof error.error === 'object' ? error.error?.message : error.error) ?? '';
        const translationKey =
          BACKEND_ERROR_MESSAGE_KEYS_MAP[String(backendMessage)] ?? ERROR_MESSAGE_KEYS.general.unknown;
        const friendlyMessage = translate.instant(translationKey);
        const closeLabel = translate.instant('COMMON.CLOSE');
        snackBar.open(friendlyMessage, closeLabel, {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }

      return throwError(() => error);
    })
  );
};
