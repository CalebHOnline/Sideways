import { useEffect, useMemo, useState } from 'react';
import { isLoggedIn } from './auth.js';
import { themeFrom, useAmbientColor } from './color.js';
import { usePlayback, useProgress, useWakeLock } from './hooks.js';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon, SpeakerIcon } from './icons.jsx';
import { spotify } from './spotify.js';
import NoPlayback from './NoPlayback.jsx';

const REPEAT_NEXT = { off: 'context', context: 'track', track: 'off' };
const REPEAT_LABEL = { off: 'Repeat off', context: 'Repeat all', track: 'Repeat one' };

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function describe(item) {
  if (!item) return {};
  if (item.type === 'episode') {
    return {
      art: item.images?.[0]?.url || item.show?.images?.[0]?.url,
      title: item.name,
      artist: item.show?.name,
      album: item.show?.publisher,
    };
  }
  return {
    art: item.album?.images?.[0]?.url,
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(', '),
    album: item.album?.name,
  };
}

function friendlyError(err) {
  if (err.status === 403) return 'Spotify won’t allow that right now. Controls need Premium, and some tracks block skipping or seeking.';
  if (err.status === 404) return 'Spotify isn’t active on any device. Open Spotify and play something.';
  if (err.status === 429) return 'Too many requests. Waiting a few seconds.';
  return err.message;
}

export default function Player({ onLogout }) {
  useWakeLock();
  const { playback, error, refresh, patch, markAction, fetchedAt } = usePlayback();
  const progress = useProgress(playback, fetchedAt);
  const [scrub, setScrub] = useState(null);
  const [notice, setNotice] = useState(null);

  const item = playback?.item;
  const info = describe(item);
  const theme = themeFrom(useAmbientColor(info.art));

  // Tint the whole page, including the overscroll area, from the cover.
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement.style;
    root.setProperty('--bg', theme.bg);
    root.setProperty('--bg-raised', theme.bgRaised);
    root.setProperty('--accent', theme.accent);
  }, [theme?.bg, theme?.accent]);

  useEffect(() => {
    if (error?.status === 401 && !isLoggedIn()) onLogout();
  }, [error, onLogout]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const disallows = playback?.actions?.disallows || {};

  async function run(action, optimistic) {
    if (optimistic) patch(optimistic);
    else markAction();
    try {
      await action();
    } catch (err) {
      setNotice(friendlyError(err));
    } finally {
      setTimeout(refresh, 450);
    }
  }

  const togglePlay = () =>
    playback?.is_playing
      ? run(spotify.pause, { is_playing: false })
      : run(spotify.play, { is_playing: true });

  const commitScrub = () => {
    if (scrub === null) return;
    const ms = scrub;
    setScrub(null);
    run(() => spotify.seek(ms), { progress_ms: ms });
  };

  const duration = item?.duration_ms || 1;
  const shown = scrub ?? progress;
  const pct = useMemo(() => `${((shown / duration) * 100).toFixed(2)}%`, [shown, duration]);

  if (playback === undefined && !error) return <main className="screen" />;
  if (!item) return <NoPlayback onPlaying={refresh} onLogout={onLogout} />;

  return (
    <main className="screen player">
      <button
        className="art-button"
        onClick={togglePlay}
        aria-label={playback.is_playing ? 'Pause' : 'Play'}
        disabled={playback.is_playing ? disallows.pausing : disallows.resuming}
      >
        {info.art ? <img className="art" src={info.art} alt="" /> : <div className="art art-empty" />}
      </button>

      <section className="info">
        <div className="meta">
          <h1 className="title" key={item.id}>{info.title}</h1>
          <p className="artist">{info.artist}</p>
          <p className="album">{info.album}</p>
        </div>

        <div className="transport">
          <div className="seek-row">
            <input
              className="seek"
              type="range"
              min={0}
              max={duration}
              step={1000}
              value={shown}
              style={{ '--pct': pct }}
              aria-label="Seek"
              aria-valuetext={`${formatTime(shown)} of ${formatTime(duration)}`}
              disabled={disallows.seeking}
              onChange={(e) => setScrub(Number(e.target.value))}
              onPointerUp={commitScrub}
              onTouchEnd={commitScrub}
              onKeyUp={commitScrub}
            />
            <div className="times">
              <span>{formatTime(shown)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls">
            <button
              className={`ctl toggle${playback.shuffle_state ? ' on' : ''}`}
              aria-label="Shuffle"
              aria-pressed={playback.shuffle_state}
              disabled={disallows.toggling_shuffle}
              onClick={() => run(() => spotify.shuffle(!playback.shuffle_state), { shuffle_state: !playback.shuffle_state })}
            >
              <ShuffleIcon />
            </button>
            <button className="ctl" aria-label="Previous" disabled={disallows.skipping_prev} onClick={() => run(spotify.previous)}>
              <PrevIcon />
            </button>
            <button
              className="ctl play"
              aria-label={playback.is_playing ? 'Pause' : 'Play'}
              disabled={playback.is_playing ? disallows.pausing : disallows.resuming}
              onClick={togglePlay}
            >
              {playback.is_playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="ctl" aria-label="Next" disabled={disallows.skipping_next} onClick={() => run(spotify.next)}>
              <NextIcon />
            </button>
            <button
              className={`ctl toggle${playback.repeat_state !== 'off' ? ' on' : ''}`}
              aria-label={REPEAT_LABEL[playback.repeat_state]}
              disabled={disallows.toggling_repeat_context && disallows.toggling_repeat_track}
              onClick={() => {
                const next = REPEAT_NEXT[playback.repeat_state] || 'off';
                run(() => spotify.repeat(next), { repeat_state: next });
              }}
            >
              <RepeatIcon one={playback.repeat_state === 'track'} />
            </button>
          </div>

          <div className="footer">
            {playback.device && (
              <span className="device">
                <SpeakerIcon /> {playback.device.name}
              </span>
            )}
            <button className="text-button" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </section>

      {notice && <p className="notice" role="status">{notice}</p>}
    </main>
  );
}
