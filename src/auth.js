// Spotify login using Authorization Code with PKCE (no client secret needed in the browser).

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/`;

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];

const TOKENS_KEY = 'sideways:tokens';
const VERIFIER_KEY = 'sideways:verifier';
const STATE_KEY = 'sideways:state';

export const hasClientId = () => Boolean(CLIENT_ID && CLIENT_ID !== 'your_client_id_here');

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function challengeFrom(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(digest);
}

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY));
  } catch {
    return null;
  }
}

function saveTokens(data, previous) {
  const tokens = {
    access_token: data.access_token,
    // Spotify doesn't always send a new refresh token; keep the old one if not.
    refresh_token: data.refresh_token || previous?.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  return tokens;
}

async function tokenRequest(body) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `Token request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function login() {
  const verifier = randomString(64);
  const state = randomString(16);
  // localStorage (not sessionStorage) so it survives the hop out to Spotify on iOS.
  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: await challengeFrom(verifier),
    state,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

// Call once on startup. Finishes the login if Spotify just redirected back here.
export async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (!code && !error) return;

  window.history.replaceState({}, '', window.location.pathname);

  if (error) {
    throw new Error(error === 'access_denied' ? 'Spotify login was cancelled.' : `Spotify login failed: ${error}`);
  }

  const expectedState = localStorage.getItem(STATE_KEY);
  const verifier = localStorage.getItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(VERIFIER_KEY);

  if (!verifier || params.get('state') !== expectedState) {
    throw new Error('The login session expired. Log in again.');
  }

  const data = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  saveTokens(data);
}

let refreshing = null;

export async function getAccessToken({ forceRefresh = false } = {}) {
  const tokens = readTokens();
  if (!tokens) return null;
  if (!forceRefresh && Date.now() < tokens.expires_at - 60_000) return tokens.access_token;

  if (!refreshing) {
    refreshing = tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token })
      .then((data) => saveTokens(data, tokens).access_token)
      .catch((err) => {
        // A rejected refresh token means the login is gone; a network blip doesn't.
        if (err.status === 400 || err.status === 401) logout();
        throw err;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export const isLoggedIn = () => Boolean(readTokens());

export function logout() {
  localStorage.removeItem(TOKENS_KEY);
}
