// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { CacheModule, DatabaseModule, LoggerModule } from '@money-manager/infrastructure';
import { UserProfileEntity } from './infrastructure/persistence/user-profile.entity';
import { UserProfileRepositoryImpl } from './infrastructure/persistence/user-profile.repository.impl';
import { USER_PROFILE_REPOSITORY } from './domain/repositories/user-profile.repository.port';
import { CardLayoutEntity } from './infrastructure/persistence/card-layout.entity';
import { CardLayoutRepositoryImpl } from './infrastructure/persistence/card-layout.repository.impl';
import { CARD_LAYOUT_REPOSITORY } from './domain/repositories/card-layout.repository.port';
import { CardLayoutCacheService } from './infrastructure/cache/card-layout-cache.service';
import { GetMyProfileHandler } from './application/handlers/get-my-profile.handler';
import { GetPublicProfileHandler } from './application/handlers/get-public-profile.handler';
import { UpdateProfileHandler } from './application/handlers/update-profile.handler';
import { UpdatePreferencesHandler } from './application/handlers/update-preferences.handler';
import { GetCardLayoutHandler } from './application/handlers/get-card-layout.handler';
import { UpdateCardLayoutHandler } from './application/handlers/update-card-layout.handler';
import { UsersController } from './presentation/controllers/users.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { CardLayoutController } from './presentation/controllers/card-layout.controller';

@Module({
  imports: [
    CacheModule.forRoot({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: Number(process.env['REDIS_PORT'] ?? 6379),
      password: process.env['REDIS_PASSWORD'],
    }),
    DatabaseModule.forRoot({
      clientUrl: process.env['USER_DATABASE_URL'] ?? process.env['DATABASE_URL'],
      host: process.env['USER_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['USER_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['USER_DB_NAME'] ?? process.env['DB_NAME'] ?? 'user_db',
      user: process.env['USER_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['USER_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [UserProfileEntity, CardLayoutEntity],
      debug: process.env['NODE_ENV'] !== 'production',
    }),
    DatabaseModule.forFeature([UserProfileEntity, CardLayoutEntity]),
    LoggerModule,
  ],
  controllers: [UsersController, HealthController, CardLayoutController],
  providers: [
    { provide: USER_PROFILE_REPOSITORY, useClass: UserProfileRepositoryImpl },
    { provide: CARD_LAYOUT_REPOSITORY, useClass: CardLayoutRepositoryImpl },
    CardLayoutCacheService,
    GetMyProfileHandler,
    GetPublicProfileHandler,
    UpdateProfileHandler,
    UpdatePreferencesHandler,
    GetCardLayoutHandler,
    UpdateCardLayoutHandler,
  ],
})
export class AppModule {}
