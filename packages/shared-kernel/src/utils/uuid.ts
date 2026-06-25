// ponytail: uuid helpers backed by Node crypto
import { randomUUID } from 'crypto';

// generate a v4 uuid
export function generateUuid(): string {
  return randomUUID();
}

// validate standard uuid v4 format
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
