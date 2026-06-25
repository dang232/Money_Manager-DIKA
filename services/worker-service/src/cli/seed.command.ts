// ponytail: CLI seed command — run with --seed or AUTO_SEED=true
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedDataJob } from '../jobs/seed-data.job';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedJob = app.get(SeedDataJob);

  const userId = process.argv.find(a => a.startsWith('--userId='))?.split('=')[1];
  await seedJob.execute(userId);

  await app.close();
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
