import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.enableCors({
    origin: ['http://localhost:4200'],
  });

  const config = new DocumentBuilder()
    .setTitle('SCIB Candidates API')
    .setDescription('Endpoints for loading candidates')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API running on http://localhost:${port}`);
  logger.log(`Docs on http://localhost:${port}/docs`);
}
void bootstrap();
