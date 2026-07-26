import { formatDistanceToNowStrict, format } from 'date-fns';

export const timeAgo = (date) =>
  date ? `${formatDistanceToNowStrict(new Date(date))} ago` : '—';

export const dateTime = (date) => (date ? format(new Date(date), 'dd MMM, HH:mm:ss') : '—');
export const dayLabel = (date) => (date ? format(new Date(date), 'dd MMM') : '');

export const minutes = (m) =>
  m === null || m === undefined ? '—' : m < 1 ? `${Math.round(m * 60)}s` : `${m.toFixed(1)}m`;

/** mm:ss, clamped at zero. */
export const clock = (ms) => {
  const safe = Math.max(0, ms);
  const total = Math.floor(safe / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many ?? `${one}s`}`;
