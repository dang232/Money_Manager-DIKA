// ponytail: user-service entry — HTTPS with mandatory mTLS when MTLS_ENABLED=true
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ApiExceptionFilter } from '@money-manager/shared-kernel';
import { AppModule } from './app.module';

function loadHttpsOptions() {
  if (process.env['MTLS_ENABLED'] !== 'true') return undefined;
  return {
    cert: readFileSync(process.env['MTLS_CERT_PATH']!),
    key: readFileSync(process.env['MTLS_KEY_PATH']!),
    ca: readFileSync(process.env['MTLS_CA_PATH']!),
    requestCert: process.env['MTLS_REQUEST_CLIENT_CERT'] !== 'false',
    rejectUnauthorized: process.env['MTLS_REJECT_UNAUTHORIZED'] !== 'false',
  };
}

async function bootstrap() {
  const httpsOptions = loadHttpsOptions();
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = process.env['PORT'] ?? 3005;
  await app.listen(port);
}

bootstrap();