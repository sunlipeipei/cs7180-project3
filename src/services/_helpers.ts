/** Shared latency constant — swap to 0 in tests if ever needed. */
export const SIMULATED_LATENCY_MS = 80;

/** Simulates network/DB latency. */
export function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Returns a deep clone so callers cannot mutate internal service state. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
