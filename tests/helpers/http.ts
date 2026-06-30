// Shared HTTP client for integration tests
import axios, { AxiosInstance } from 'axios';

const baseURL = process.env['GATEWAY_URL'] ?? 'http://localhost:3000';

// validateStatus: () => true so callers see every response code
export const http: AxiosInstance = axios.create({ baseURL, validateStatus: () => true });

// FIXED: Test user ID - NOT the old DEFAULT. Tests should use explicit user IDs.
export const TEST_USER_ID = '22222222-2222-4222-a222-222222222222';

/**
 * Generate user headers for API requests.
 * Tests should pass explicit user IDs for proper multi-user testing.
 */
export function userHeaders(userId: string): Record<string, string> {
  return { 'x-user-id': userId };
}