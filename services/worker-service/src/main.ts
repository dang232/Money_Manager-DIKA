// ponytail: bootstrap worker service — optionally runs seed on startup
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedDataJob } from './jobs/seed-data.job';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Auto-seed if requested
  if (process.env['AUTO_SEED'] === 'true' || process.argv.includes('--seed')) {
    const seedJob = app.get(SeedDataJob);
    await seedJob.execute();
  }

  const port = process.env['PORT'] ?? 3004;
  await app.listen(port);
  console.log(`Worker service running on port ${port}`);
}

bootstrap();
