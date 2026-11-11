import { useEffect, useState } from 'react';

// Pulls a representative color out of the album art, favouring saturated mid-tones
// over the blacks and whites most covers are full of.
export function useAmbientColor(url) {
  const [rgb, setRgb] = useState(null);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2];
          const max = Math.max(R, G, B), min = Math.min(R, G, B);
          const sat = (max - min) / 255;
          const light = (max + min) / 510;
          const weight = 0.05 + sat * sat * (1 - Math.abs(light - 0.5) * 1.6);
          if (weight <= 0) continue;
          r += R * weight; g += G * weight; b += B * weight; total += weight;
        }
        if (alive && total > 0) setRgb([r / total, g / total, b / total]);
      } catch {
        // Canvas was tainted or failed; keep the previous color.
      }
    };
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);

  return rgb;
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

// A deep background and a light accent in the cover's hue.
export function themeFrom(rgb) {
  if (!rgb) return null;
  const [h, s] = rgbToHsl(rgb);
  const bgSat = Math.min(s, 0.55) * 100;
  return {
    bg: `hsl(${h.toFixed(0)} ${bgSat.toFixed(0)}% 17%)`,
    bgRaised: `hsl(${h.toFixed(0)} ${bgSat.toFixed(0)}% 24%)`,
    accent: `hsl(${h.toFixed(0)} ${Math.max(45, Math.min(s * 100, 85)).toFixed(0)}% 74%)`,
  };
}
