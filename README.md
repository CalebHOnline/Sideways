# Sideways

A landscape now-playing screen for Spotify. Music keeps playing through the Spotify app; Sideways shows the album art, track info, and controls in a layout that works with your iPhone turned on its side. The background takes its color from the current album cover.

## 1. Create the Spotify app

1. Go to https://developer.spotify.com/dashboard and choose **Create app**.
2. Under **Which API/SDKs are you planning to use?**, check **Web API**.
3. Add these **Redirect URIs**. They must match exactly, including the trailing slash:
   - `http://127.0.0.1:5173/` for local development (Spotify no longer accepts `localhost`)
   - `https://YOUR-APP.vercel.app/` once you've deployed (add it after step 3 below)
4. Save, then copy the **Client ID** from the app's settings. You don't need the client secret.

If you'll log in with a Spotify account other than the one that owns the app, add it under **User Management**. Apps in development mode only work for accounts on that list.

## 2. Run it on your computer

```bash
cp .env.example .env        # then paste your Client ID into .env
npm install
npm run dev
```

Open http://127.0.0.1:5173/ (use 127.0.0.1, not localhost, so it matches the redirect URI). Start a song in Spotify on any device, then log in.

## 3. Put it on your iPhone

Your phone can't reach `127.0.0.1`, and Spotify requires HTTPS for any other address, so deploy it:

1. Push this folder to a GitHub repo.
2. On https://vercel.com, choose **Add New → Project** and import the repo. Vercel detects Vite automatically.
3. Under **Environment Variables**, add `VITE_SPOTIFY_CLIENT_ID` with your Client ID, then deploy.
4. Add the deployed address (for example `https://sideways-caleb.vercel.app/`) to the Redirect URIs in the Spotify dashboard.

On the iPhone:

1. Open the deployed address in **Safari**.
2. Tap **Share → Add to Home Screen**. Launching from the home screen gives you full screen without Safari's bars.
3. Open it from the home screen and log in.
4. Turn off Portrait Orientation Lock in Control Center, then rotate the phone.

## Things to know

- **Spotify Premium is required** for play, pause, skip, and seek. Free accounts can see what's playing but not control it.
- **Spotify has to be active.** If nothing is playing, Sideways shows your available devices. Your iPhone appears there only while the Spotify app is open, so the easiest fix is to start a song in Spotify and switch back.
- **Tap the album art** to play or pause, which is handy when the phone is propped up.
- **The screen stays on** while Sideways is open (iOS 16.4 or later).
- Sideways checks Spotify once a second and pauses checking when it's in the background.

## Project layout

```
src/auth.js        PKCE login, token storage and refresh
src/spotify.js     Web API calls (playback state, controls, devices)
src/hooks.js       Polling, smooth progress, screen wake lock
src/color.js       Album-art color extraction for the background
src/Player.jsx     The now-playing screen
src/NoPlayback.jsx Shown when nothing is playing; pick a device
src/App.jsx        Setup, login, and routing between screens
src/styles.css     Portrait and landscape layouts
```
