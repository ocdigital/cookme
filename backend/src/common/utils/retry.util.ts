export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    shouldRetry?: (err: any) => boolean;
  } = {},
): Promise<T> {
  const { maxAttempts = 3, initialDelayMs = 500, shouldRetry = () => true } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts || !shouldRetry(err)) {
        throw err;
      }

      const delay = initialDelayMs * Math.pow(2, attempt - 1); // 500ms, 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function isRateLimitError(err: any): boolean {
  const msg = String(err?.message || err?.toString() || '').toLowerCase();
  return (
    err?.status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit')
  );
}

export function isTransientError(err: any): boolean {
  const msg = String(err?.message || err?.toString() || '').toLowerCase();
  return (
    isRateLimitError(err) ||
    err?.status === 503 ||
    msg.includes('503') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('socket hang up')
  );
}
