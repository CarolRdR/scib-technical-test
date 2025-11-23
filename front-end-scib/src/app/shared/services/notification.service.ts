import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  translate = inject(TranslateService);

  constructor(private readonly snackBar: MatSnackBar) {}

  public showSuccess(translationKey: string, params?: Record<string, unknown>, config?: MatSnackBarConfig): void {
    this.openSnackBar(translationKey, params, {
      duration: 3000,
      panelClass: ['snackbar-success'],
      ...config
    });
  }

  public showError(translationKey: string, params?: Record<string, unknown>, config?: MatSnackBarConfig): void {
    this.openSnackBar(translationKey, params, {
      duration: 4000,
      panelClass: ['snackbar-error'],
      ...config
    });
  }

  private openSnackBar(
    translationKey: string,
    params: Record<string, unknown> = {},
    config: MatSnackBarConfig = {}
  ): void {
    this.snackBar.open(this.translate.instant(translationKey, params), this.translate.instant('COMMON.CLOSE'), config);
  }
}
