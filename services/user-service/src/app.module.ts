// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { DatabaseModule, LoggerModule } from '@money-manager/infrastructure';
import { UserProfileEntity } from './infrastructure/persistence/user-profile.entity';
import { UserProfileRepositoryImpl } from './infrastructure/persistence/user-profile.repository.impl';
import { USER_PROFILE_REPOSITORY } from './domain/repositories/user-profile.repository.port';
import { GetMyProfileHandler } from './application/handlers/get-my-profile.handler';
import { GetPublicProfileHandler } from './application/handlers/get-public-profile.handler';
import { UpdateProfileHandler } from './application/handlers/update-profile.handler';
import { UpdatePreferencesHandler } from './application/handlers/update-preferences.handler';
import { UsersController } from './presentation/controllers/users.controller';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    DatabaseModule.forRoot({
      host: process.env['USER_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['USER_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['USER_DB_NAME'] ?? process.env['DB_NAME'] ?? 'user_db',
      user: process.env['USER_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['USER_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [UserProfileEntity],
      debug: process.env['NODE_ENV'] !== 'production',
    }),
    DatabaseModule.forFeature([UserProfileEntity]),
    LoggerModule,
  ],
  controllers: [UsersController, HealthController],
  providers: [
    { provide: USER_PROFILE_REPOSITORY, useClass: UserProfileRepositoryImpl },
    GetMyProfileHandler,
    GetPublicProfileHandler,
    UpdateProfileHandler,
    UpdatePreferencesHandler,
  ],
})
export class AppModule {}