// Dates are stored at UTC midnight, so they are formatted in UTC to avoid off-by-one days.
export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

/** "2026-10-14T00:00:00.000Z" -> "2026-10-14" for <input type="date"> */
export const toInputDate = (value) => (value ? String(value).slice(0, 10) : '');
