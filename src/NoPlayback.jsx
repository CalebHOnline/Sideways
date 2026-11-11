import { useCallback, useEffect, useState } from 'react';
import { spotify } from './spotify.js';

export default function NoPlayback({ onPlaying, onLogout }) {
  const [devices, setDevices] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await spotify.devices();
      setDevices(data?.devices || []);
    } catch (err) {
      setMessage(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function playOn(device) {
    setMessage(null);
    try {
      await spotify.transfer(device.id);
      setTimeout(onPlaying, 600);
    } catch (err) {
      setMessage(err.status === 403 ? 'Controlling playback needs Spotify Premium.' : err.message);
    }
  }

  return (
    <main className="screen intro">
      <h1 className="wordmark">Sideways</h1>
      <div className="intro-body">
        <p className="lede">Nothing is playing.</p>
        <p className="fine">
          Open the Spotify app, start any song, then come back here. Or pick a device where Spotify is open.
        </p>

        {devices && devices.length > 0 && (
          <ul className="devices">
            {devices.map((d) => (
              <li key={d.id}>
                <button className="device-button" onClick={() => playOn(d)}>
                  <span>{d.name}</span>
                  <span className="device-type">{d.type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {devices && devices.length === 0 && (
          <p className="fine">No devices found. Your iPhone shows up here only while the Spotify app is open.</p>
        )}

        <div className="row">
          <button className="secondary" onClick={() => { load(); onPlaying(); }}>Check again</button>
          <button className="text-button" onClick={onLogout}>Log out</button>
        </div>
        {message && <p className="error" role="alert">{message}</p>}
      </div>
    </main>
  );
}
