// ponytail: poll until predicate passes or timeout
import axios from 'axios';

export async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => boolean,
  timeoutMs = 5000,
  intervalMs = 250,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: T;
  while (Date.now() < deadline) {
    last = await fn();
    if (predicate(last)) return last;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

// ponytail: wait until gateway /health reports all downstream services up.
// Use in beforeAll so a stale-open circuit breaker (from a prior failed test run)
// has time to half-open and re-close before tests assert.
export async function waitForHealthyStack(gatewayUrl = 'http://localhost:3000'): Promise<void> {
  await waitFor(
    async () => {
      const res = await axios.get(`${gatewayUrl}/health`, { validateStatus: () => true });
      if (res.status !== 200) return false;
      const services = res.data?.services ?? [];
      return Array.isArray(services) && services.every((s: { status: string }) => s.status === 'up');
    },
    (up) => up === true,
    30_000,
    500,
  );
}