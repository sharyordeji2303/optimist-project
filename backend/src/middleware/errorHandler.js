/** Any unmatched route. Keeps 404s in the same JSON shape as real errors. */
export function notFound(req, res) {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} does not exist.`,
      code: 'NOT_FOUND',
    },
  });
}

/**
 * Central error handler.
 * Internal messages are logged but never sent to the client, so stack traces and
 * driver errors cannot leak implementation detail.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      message: status >= 500 ? 'Something went wrong on our side.' : err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  });
}
