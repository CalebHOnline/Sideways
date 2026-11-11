import { getAccessToken } from './auth.js';

const BASE = 'https://api.spotify.com/v1';

export class ApiError extends Error {
  constructor(message, status, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', query, body } = {}, retried = false) {
  const token = await getAccessToken({ forceRefresh: retried });
  if (!token) throw new ApiError('Not logged in', 401);

  const url = new URL(BASE + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried) return request(path, { method, query, body }, true);
  if (res.status === 202 || res.status === 204) return null;

  const text = await res.text();
  const data = text ? parse(text) : null;

  if (!res.ok) {
    const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
    throw new ApiError(data?.error?.message || `Spotify request failed (${res.status})`, res.status, retryAfter);
  }
  return data;
}

export const spotify = {
  // Returns null when nothing is playing anywhere.
  playback: () => request('/me/player', { query: { additional_types: 'track,episode' } }),
  devices: () => request('/me/player/devices'),
  play: () => request('/me/player/play', { method: 'PUT' }),
  pause: () => request('/me/player/pause', { method: 'PUT' }),
  next: () => request('/me/player/next', { method: 'POST' }),
  previous: () => request('/me/player/previous', { method: 'POST' }),
  seek: (ms) => request('/me/player/seek', { method: 'PUT', query: { position_ms: Math.round(ms) } }),
  shuffle: (state) => request('/me/player/shuffle', { method: 'PUT', query: { state } }),
  repeat: (state) => request('/me/player/repeat', { method: 'PUT', query: { state } }),
  transfer: (deviceId) =>
    request('/me/player', { method: 'PUT', body: { device_ids: [deviceId], play: true } }),
};
