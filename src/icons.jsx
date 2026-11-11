const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true };

export const PlayIcon = () => (
  <svg {...base} fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" /></svg>
);
export const PauseIcon = () => (
  <svg {...base} fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
);
export const NextIcon = () => (
  <svg {...base} fill="currentColor"><path d="M5 6.3v11.4a.9.9 0 0 0 1.38.76l8.6-5.7a.9.9 0 0 0 0-1.52l-8.6-5.7A.9.9 0 0 0 5 6.3Z" /><rect x="16.5" y="5" width="2.6" height="14" rx="1.1" /></svg>
);
export const PrevIcon = () => (
  <svg {...base} fill="currentColor"><path d="M19 6.3v11.4a.9.9 0 0 1-1.38.76l-8.6-5.7a.9.9 0 0 1 0-1.52l8.6-5.7A.9.9 0 0 1 19 6.3Z" /><rect x="4.9" y="5" width="2.6" height="14" rx="1.1" /></svg>
);
export const ShuffleIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21" />
    <path d="M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4c.8-.9 1.8-1.4 3.2-1.4H21" />
    <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
  </svg>
);
export const RepeatIcon = ({ one }) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5" />
    <path d="m16 3 3 3-3 3M8 21l-3-3 3-3" />
    {one && <path d="M12 10.2v4.3M11 11l1-.8" strokeWidth="1.6" />}
  </svg>
);
export const SpeakerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);
