// ponytail: retry helper — defends against the gateway's circuit breaker being
// temporarily open at the start of a test run (stale state from prior failures).
import type { AxiosResponse } from 'axios';

export async function withRetry<T>(
  fn: () => Promise<AxiosResponse<T>>,
  isOk: (r: AxiosResponse<T>) => boolean,
  attempts = 6,
  delayMs = 500,
): Promise<AxiosResponse<T>> {
  let last: AxiosResponse<T> | undefined;
  for (let i = 0; i < attempts; i++) {
    last = await fn();
    if (isOk(last)) return last;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return last!;
}