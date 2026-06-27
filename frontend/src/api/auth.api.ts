import httpClient from './http-client'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export interface AuthTokens {
  user: AuthUser
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  tokenType: 'Bearer'
}

export interface RegisterDto {
  email: string
  password: string
  displayName: string
}

export interface LoginDto {
  email: string
  password: string
}

export const authApi = {
  register(dto: RegisterDto) {
    return httpClient.post<{ data: AuthTokens }>('/auth/register', dto)
  },
  login(dto: LoginDto) {
    return httpClient.post<{ data: AuthTokens }>('/auth/login', dto)
  },
  refresh(refreshToken: string) {
    return httpClient.post<{ data: Omit<AuthTokens, 'user'> }>('/auth/refresh', { refreshToken })
  },
  logout(refreshToken: string) {
    return httpClient.post('/auth/logout', { refreshToken })
  },
  me() {
    return httpClient.get<{ data: AuthUser }>('/auth/me')
  },
}
