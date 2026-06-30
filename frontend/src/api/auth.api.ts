import httpClient from './http-client'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  createdAt: string
}

// ponytail: tokens no longer returned in the response body — they live in HttpOnly cookies
export interface AuthLoginResponse {
  user: AuthUser
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
    return httpClient.post<AuthLoginResponse>('/auth/register', dto)
  },
  login(dto: LoginDto) {
    return httpClient.post<AuthLoginResponse>('/auth/login', dto)
  },
  // ponytail: refresh token comes from mm-rt HttpOnly cookie — no body needed
  refresh() {
    return httpClient.post('/auth/refresh', {})
  },
  // ponytail: refresh token comes from mm-rt HttpOnly cookie — no body needed
  logout() {
    return httpClient.post('/auth/logout', {})
  },
  me() {
    return httpClient.get<AuthUser>('/auth/me')
  },
}
