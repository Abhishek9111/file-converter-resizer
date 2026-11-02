import { useState } from 'react';

// Keeps the typed text separately so a field can be emptied mid-edit.
export default function NumberField({ value, min = 1, onCommit, ...props }) {
  const [draft, setDraft] = useState(null);

  function handleChange(e) {
    setDraft(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (parsed >= min) onCommit(parsed);
  }

  return (
    <input
      type="number"
      className="input-field"
      min={min}
      value={draft ?? value}
      onChange={handleChange}
      onBlur={() => setDraft(null)}
      {...props}
    />
  );
}
