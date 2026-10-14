const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  // Stop spreadsheet formula injection when the file is opened in Excel or Sheets
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** columns: [{ header, value: (row) => any }] */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}`; // BOM so Excel reads UTF-8 correctly
}
