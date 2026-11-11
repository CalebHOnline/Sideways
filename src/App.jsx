import { useEffect, useState } from 'react';
import { handleRedirect, hasClientId, isLoggedIn, login, logout, REDIRECT_URI } from './auth.js';
import Player from './Player.jsx';

export default function App() {
  const [status, setStatus] = useState('checking');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    handleRedirect()
      .catch((err) => setAuthError(err.message))
      .finally(() => setStatus(isLoggedIn() ? 'in' : 'out'));
  }, []);

  if (!hasClientId()) return <Setup />;
  if (status === 'checking') return <main className="screen" />;
  if (status === 'out') return <Login error={authError} />;

  return (
    <Player
      onLogout={() => {
        logout();
        setStatus('out');
      }}
    />
  );
}

function Login({ error }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="screen intro">
      <h1 className="wordmark">Sideways</h1>
      <div className="intro-body">
        <p className="lede">Spotify’s now-playing screen, built for when your phone is on its side.</p>
        <button
          className="primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            login().catch(() => setBusy(false));
          }}
        >
          {busy ? 'Opening Spotify…' : 'Log in with Spotify'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="fine">Playback controls need Spotify Premium. Music plays through the Spotify app.</p>
      </div>
    </main>
  );
}

function Setup() {
  return (
    <main className="screen intro">
      <h1 className="wordmark">Sideways</h1>
      <div className="intro-body">
        <p className="lede">Add your Spotify client ID to finish setup.</p>
        <p className="fine">
          Copy <code>.env.example</code> to <code>.env</code>, paste your client ID into{' '}
          <code>VITE_SPOTIFY_CLIENT_ID</code>, and restart the dev server. In the Spotify dashboard, add this redirect URI:
        </p>
        <p className="fine"><code>{REDIRECT_URI}</code></p>
      </div>
    </main>
  );
}
