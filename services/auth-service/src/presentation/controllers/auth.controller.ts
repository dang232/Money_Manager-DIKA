// ponytail: /auth REST controller — register, login, refresh, logout, me
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { RegisterHandler } from '../../application/handlers/register.handler';
import { LoginHandler } from '../../application/handlers/login.handler';
import { RefreshTokenHandler } from '../../application/handlers/refresh-token.handler';
import { LogoutHandler } from '../../application/handlers/logout.handler';
import { GetMeHandler } from '../../application/handlers/get-me.handler';
import { RegisterCommand } from '../../application/commands/register.command';
import { LoginCommand } from '../../application/commands/login.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import { LogoutCommand } from '../../application/commands/logout.command';
import { GetMeQuery } from '../../application/queries/get-me.query';
import {
  AuthTokensResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  UserResponseDto,
} from '../dtos/auth.dto';
import { User } from '../../domain/aggregates/user.aggregate';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshHandler: RefreshTokenHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly getMeHandler: GetMeHandler,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerHandler.execute(
      new RegisterCommand(dto.email, dto.password, dto.displayName),
    );
    return ApiResponse.ok(this.toAuthResponse(result.user, result.tokens));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.loginHandler.execute(new LoginCommand(dto.email, dto.password));
    return ApiResponse.ok(this.toAuthResponse(result.user, result.tokens));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.refreshHandler.execute(new RefreshTokenCommand(dto.refreshToken));
    return ApiResponse.ok({
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      tokenType: 'Bearer' as const,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.logoutHandler.execute(new LogoutCommand(dto.refreshToken));
  }

  @Get('me')
  async me(@CurrentUser() userId: UserId) {
    const user = await this.getMeHandler.execute(new GetMeQuery(userId.value));
    return ApiResponse.ok(this.toUserResponse(user));
  }

  private toAuthResponse(user: User, tokens: { accessToken: string; accessTokenExpiresAt: Date; refreshToken: string; refreshTokenExpiresAt: Date }): AuthTokensResponseDto {
    return {
      user: this.toUserResponse(user),
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      tokenType: 'Bearer',
    };
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email.value,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }
}