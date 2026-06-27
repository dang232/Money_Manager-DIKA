// ponytail: shared HTTP client — defaults to local gateway, override via GATEWAY_URL
import axios, { AxiosInstance } from 'axios';

const baseURL = process.env['GATEWAY_URL'] ?? 'http://localhost:3000';

// ponytail: validateStatus: () => true so callers see every response code
export const http: AxiosInstance = axios.create({ baseURL, validateStatus: () => true });

export const DEFAULT_USER_ID = '00000000-0000-4000-a000-000000000001';

export function userHeaders(userId: string = DEFAULT_USER_ID): Record<string, string> {
  return { 'x-user-id': userId };
}