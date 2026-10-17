import { env } from '../config/env.js';

function dayInTz(date, timezone) {
  try {
    // Intl-based, no dependency. Returns YYYY-MM-DD in the given timezone.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function currentDayBucket(timezone = env.AI_TIMEZONE, now = new Date()) {
  return dayInTz(now, timezone);
}
