import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Reads and writes list state (filters, sort, page) in the URL, so a copied link reproduces the view.
 * Changing any filter resets the page to 1 unless `keepPage` is passed.
 */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const params = Object.fromEntries(searchParams.entries());

  const update = useCallback(
    (changes, { keepPage = false } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) next.delete(key);
          else next.set(key, String(value));
        });
        if (!keepPage && !('page' in changes)) next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  return { params, query, update };
}
