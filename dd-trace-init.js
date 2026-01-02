// dd-trace-init.js
// This file initializes the Datadog Node tracer if a DATADOG_API_KEY (or agent) is available.
// It is required at Node startup via NODE_OPTIONS so it runs before the app code.
try {
  /* eslint-disable global-require */
  const dd = require('dd-trace');

  // Initialize tracer with sensible defaults; runtime behavior is controlled by env vars.
  dd.init({
    service: process.env.DD_SERVICE || 'jira-clone',
    env: process.env.DD_ENV || process.env.NODE_ENV || 'production',
    runtimeMetrics: true,
    logInjection: true,
    analytics: process.env.DD_TRACE_ANALYTICS_ENABLED === 'true' || false,
  });
} catch (err) {
  // If dd-trace is not installed or fails to initialize, fail gracefully.
  // Keep process running — tracing is optional.
  // eslint-disable-next-line no-console
  console.warn('dd-trace init skipped:', err && err.message ? err.message : err);
}
