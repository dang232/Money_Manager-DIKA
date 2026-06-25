// ponytail: budget-service entry point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from '@money-manager/shared-kernel';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = process.env['PORT'] ?? 3002;
  await app.listen(port);
}

bootstrap();
