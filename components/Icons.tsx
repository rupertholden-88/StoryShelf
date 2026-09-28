const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ShelfIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}><path d="M5 4v16M9.5 4v16M14 6l4 14M3 20h18" /></svg>
);
export const BarcodeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 8v8M12 8v8M16 8v8" />
  </svg>
);
export const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} fill={filled ? "currentColor" : "none"}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
);
export const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={2.2}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
);
export const SpinesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}><path d="M5 5v14M9 3v16M13 6v13M17.5 4.5l3 14M3 20h18" /></svg>
);
export const CoversIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}>
    <rect x="3" y="4" width="7.5" height="11" rx="1" /><rect x="13.5" y="4" width="7.5" height="11" rx="1" /><path d="M2 19.5h20" />
  </svg>
);
export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const TorchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}><path d="M8 3h8l-1.5 6H9.5zM9.5 9v12h5V9M12 13v3" /></svg>
);
export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={2.2}><path d="M15 5l-7 7 7 7" /></svg>
);
export const StarIcon = ({ on }: { on: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
      fill={on ? "#E2A72E" : "none"} stroke={on ? "#A87512" : "#8C7F66"} strokeWidth={on ? 1.3 : 1.5} strokeLinejoin="round"
    />
  </svg>
);
export const HeartIcon = ({ on }: { on: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
      fill={on ? "#C8413A" : "none"} stroke={on ? "#9E2F29" : "#8C7F66"} strokeWidth={1.5} strokeLinejoin="round"
    />
  </svg>
);
export const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
