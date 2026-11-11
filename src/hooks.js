import { useCallback, useEffect, useRef, useState } from 'react';
import { spotify } from './spotify.js';

const POLL_MS = 1000;

// Polls Spotify for what's playing. playback is undefined while loading, null when nothing is active.
export function usePlayback() {
  const [playback, setPlayback] = useState(undefined);
  const [error, setError] = useState(null);
  const fetchedAt = useRef(0);
  const lastActionAt = useRef(0);
  const backoffUntil = useRef(0);

  const refresh = useCallback(async () => {
    const startedAt = performance.now();
    try {
      const data = await spotify.playback();
      // Ignore responses that left before the user's last tap; they'd undo the optimistic update.
      if (startedAt < lastActionAt.current) return;
      fetchedAt.current = performance.now();
      setPlayback(data);
      setError(null);
    } catch (err) {
      if (err.status === 429) backoffUntil.current = Date.now() + (err.retryAfter || 5) * 1000;
      setError(err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer;
    async function loop() {
      if (cancelled) return;
      if (document.visibilityState === 'visible' && Date.now() >= backoffUntil.current) await refresh();
      if (!cancelled) timer = setTimeout(loop, POLL_MS);
    }
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  // Apply a change locally right away, before Spotify confirms it.
  const patch = useCallback((changes) => {
    lastActionAt.current = performance.now();
    setPlayback((prev) => {
      if (!prev) return prev;
      const now = performance.now();
      const progress = prev.is_playing ? prev.progress_ms + (now - fetchedAt.current) : prev.progress_ms;
      fetchedAt.current = now;
      return { ...prev, progress_ms: progress, ...changes };
    });
  }, []);

  const markAction = useCallback(() => {
    lastActionAt.current = performance.now();
  }, []);

  return { playback, error, refresh, patch, markAction, fetchedAt };
}

// Smoothly counts up between polls so the progress bar doesn't jump once a second.
export function useProgress(playback, fetchedAt) {
  const [, tick] = useState(0);
  const playing = Boolean(playback?.is_playing);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [playing]);

  if (!playback?.item) return 0;
  const elapsed = playing ? performance.now() - fetchedAt.current : 0;
  return Math.min(playback.progress_ms + elapsed, playback.item.duration_ms);
}

// Keeps the screen on while the app is open (iOS 16.4+ home-screen apps).
export function useWakeLock() {
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Not supported or denied; the screen just follows Auto-Lock.
      }
    };
    request();
    const onVisible = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
}
