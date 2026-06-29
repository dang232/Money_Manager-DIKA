// ponytail: gateway bootstrap — CORS, validation pipe, global filters
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from '@money-manager/shared-kernel';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { CircuitOpenFilter } from './filters/circuit-open.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    credentials: true,
  });

  // ponytail: cookie-parser must come before any middleware that reads req.cookies
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ApiExceptionFilter(), new HttpExceptionFilter(), new CircuitOpenFilter());

  await app.listen(3000);
}

bootstrap();
