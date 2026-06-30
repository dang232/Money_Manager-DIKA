// ponytail: bootstrap worker service — optionally runs seed on startup
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedDataJob } from './jobs/seed-data.job';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Auto-seed if requested (requires SEED_USER_ID env var)
  if (process.env['AUTO_SEED'] === 'true' || process.argv.includes('--seed')) {
    const seedUserId = process.env['SEED_USER_ID'];
    if (!seedUserId) {
      throw new Error('SEED_USER_ID environment variable is required for seeding');
    }
    const seedJob = app.get(SeedDataJob);
    await seedJob.execute(seedUserId);
  }

  const port = process.env['PORT'] ?? 3004;
  await app.listen(port);
  console.log(`Worker service running on port ${port}`);
}

bootstrap();
