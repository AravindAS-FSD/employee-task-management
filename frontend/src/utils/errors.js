export function errorMessage(err) {
  return err?.message || 'Something went wrong. Please try again.';
}

/** Turns server details into { fieldName: message } so errors show next to the right input. */
export function fieldErrorsFrom(err) {
  const details = err?.details;
  if (Array.isArray(details)) {
    return Object.fromEntries(details.filter((d) => d.field).map((d) => [d.field, d.message]));
  }
  if (details?.field) return { [details.field]: err.message };
  return {};
}
