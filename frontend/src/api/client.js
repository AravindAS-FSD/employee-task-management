const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url;
}

async function send(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: 'Cannot reach the server. Check your connection and try again.',
    });
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError({
      status: res.status,
      code: payload.code,
      message: payload.message ?? 'Request failed',
      details: payload.details,
    });
  }
  return res;
}

async function request(method, path, { params, body } = {}) {
  const res = await send(buildUrl(path, params), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
};

/** Downloads the server-generated CSV for the given filters (all matching rows, not one page). */
export async function downloadCsv(path, params) {
  const res = await send(buildUrl(path, params));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
