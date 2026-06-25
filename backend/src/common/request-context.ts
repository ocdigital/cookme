import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface RequestContext {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string {
  return requestContext.getStore()?.requestId ?? 'no-context';
}

export function runWithRequestId<T>(fn: () => T): T {
  return requestContext.run({ requestId: randomUUID() }, fn);
}
