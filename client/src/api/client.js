/**
 * Thin wrapper around fetch for talking to the Express API.
 *
 * Two jobs: build the URL, and turn every failure into one predictable error
 * shape so components never have to guess what went wrong.
 */

// Empty by default, which means "same origin". During development Vite proxies
// /api to the Express server (see vite.config.js). In production, set
// VITE_API_URL to the deployed API, for example https://api.example.com
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, fields } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    // Field-level messages from a 422, shaped { email: 'Enter a valid email' }.
    this.fields = fields || null;
  }
}

/**
 * @param {string} path      e.g. '/api/auth/login'
 * @param {object} options   { method, body, token, signal }
 */
export async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // fetch only rejects on a network-level failure, so this is genuinely
    // "the API is unreachable", not "the API said no".
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check that the API is running.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  // 204 and empty bodies would explode on .json().
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed (${response.status}).`, {
      status: response.status,
      code: payload?.error?.code || 'HTTP_ERROR',
      fields: payload?.error?.fields,
    });
  }

  return payload;
}

export const auth = {
  signup: (credentials) => request('/api/auth/signup', { method: 'POST', body: credentials }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  me: (token, signal) => request('/api/auth/me', { token, signal }),
};
