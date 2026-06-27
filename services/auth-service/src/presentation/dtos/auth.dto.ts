// ponytail: DTOs for /auth endpoints
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  createdAt!: string;
}

export class AuthTokensResponseDto {
  user!: UserResponseDto;
  accessToken!: string;
  accessTokenExpiresAt!: string;
  refreshToken!: string;
  refreshTokenExpiresAt!: string;
  tokenType!: 'Bearer';
}