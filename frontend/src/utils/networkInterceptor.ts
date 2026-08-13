import { usePerformanceStore } from '@/store/performanceStore';

let isInterceptorInitialized = false;

/**
 * Initializes global network request interceptor for measuring latency,
 * response times, active request counts, and highlighting slow API calls.
 */
export function initNetworkInterceptor(): void {
  if (isInterceptorInitialized || typeof window === 'undefined') return;
  isInterceptorInitialized = true;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const startTime = performance.now();
    const store = usePerformanceStore.getState();
    store.incrementActiveRequests();

    let url = 'unknown';
    let method = 'GET';

    try {
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].toString();
      } else if (args[0] && typeof args[0] === 'object' && 'url' in args[0]) {
        url = (args[0] as Request).url;
      }

      if (args[1] && args[1].method) {
        method = args[1].method.toUpperCase();
      }
    } catch {
      // Ignore URL parsing errors
    }

    try {
      const response = await originalFetch.apply(this, args);
      const durationMs = Math.round(performance.now() - startTime);

      store.addNetworkCall({
        url,
        method,
        status: response.status,
        durationMs,
        timestamp: Date.now(),
        isSlow: durationMs > 500,
      });

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);

      store.addNetworkCall({
        url,
        method,
        status: 0, // Network failure or CORS error
        durationMs,
        timestamp: Date.now(),
        isSlow: durationMs > 500,
      });

      throw error;
    } finally {
      store.decrementActiveRequests();
    }
  };
}
