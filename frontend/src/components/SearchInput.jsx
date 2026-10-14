import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

/**
 * Keeps typing responsive and pushes the value to the URL after a short pause.
 * Parents remount it with a new `key` to reset it (for example on "Clear filters").
 */
export default function SearchInput({ id, value = '', placeholder, onDebouncedChange }) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, 300);

  useEffect(() => {
    if (debounced !== value) onDebouncedChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <input
      id={id}
      type="search"
      className="input"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
