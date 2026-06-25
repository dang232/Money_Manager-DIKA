// ponytail: correlation id for tracing requests across services
import { generateUuid } from './uuid';

// prefix keeps correlation ids visually distinct in logs
export function generateCorrelationId(): string {
  return `cor-${generateUuid()}`;
}
