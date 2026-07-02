// ponytail: NestJS app module — wires all layers together
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule, LoggerModule } from '@money-manager/infrastructure';
import { UserEntity } from './infrastructure/persistence/user.entity';
import { RefreshTokenEntity } from './infrastructure/persistence/refresh-token.entity';
import { UserRepositoryImpl } from './infrastructure/persistence/user.repository.impl';
import { RefreshTokenRepositoryImpl } from './infrastructure/persistence/refresh-token.repository.impl';
import { USER_REPOSITORY } from './domain/repositories/user.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.port';
import { BcryptPasswordHasher } from './infrastructure/password/bcrypt-password.hasher';
import { PASSWORD_HASHER } from './domain/services/password-hasher.port';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { TOKEN_SERVICE } from './domain/services/token-service.port';
import { RegisterHandler } from './application/handlers/register.handler';
import { LoginHandler } from './application/handlers/login.handler';
import { RefreshTokenHandler } from './application/handlers/refresh-token.handler';
import { LogoutHandler } from './application/handlers/logout.handler';
import { GetMeHandler } from './application/handlers/get-me.handler';
import { TokenIssuer } from './application/token-issuer';
import { AuthController } from './presentation/controllers/auth.controller';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({
      clientUrl: process.env['AUTH_DATABASE_URL'] ?? process.env['DATABASE_URL'],
      host: process.env['AUTH_DB_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
      port: Number(process.env['AUTH_DB_PORT'] ?? process.env['DB_PORT'] ?? 5432),
      dbName: process.env['AUTH_DB_NAME'] ?? process.env['DB_NAME'] ?? 'auth_db',
      user: process.env['AUTH_DB_USER'] ?? process.env['DB_USER'] ?? 'postgres',
      password: process.env['AUTH_DB_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? 'postgres',
      entities: [UserEntity, RefreshTokenEntity],
      debug: process.env['NODE_ENV'] !== 'production',
    }),
    DatabaseModule.forFeature([UserEntity, RefreshTokenEntity]),
    LoggerModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [
    // repositories
    { provide: USER_REPOSITORY, useClass: UserRepositoryImpl },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepositoryImpl },
    // infrastructure services
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    // handlers
    RegisterHandler,
    LoginHandler,
    RefreshTokenHandler,
    LogoutHandler,
    GetMeHandler,
    TokenIssuer,
  ],
})
export class AppModule {}
