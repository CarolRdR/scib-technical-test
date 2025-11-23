import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req?.method ?? 'UNKNOWN';
    const url = req?.url ?? 'unknown';
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${url} -> ${Date.now() - started}ms (success)`,
          );
        },
        error: (err: unknown) => {
          this.logger.error(
            `${method} ${url} -> ${Date.now() - started}ms (error: ${
              err instanceof Error ? err.message : err
            })`,
          );
        },
      }),
    );
  }
}
