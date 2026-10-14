const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-10-14" -> Date at 00:00 UTC. Returns null for impossible dates such as 2026-02-31. */
export function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? date : null;
}

/** Truncates any date to 00:00 UTC of that day. All "today" comparisons go through this. */
export function startOfDayUTC(input) {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function toDateOnlyString(date) {
  return new Date(date).toISOString().slice(0, 10);
}
