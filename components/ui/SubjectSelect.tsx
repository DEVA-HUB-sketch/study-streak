"use client";

/**
 * SubjectSelect — reusable subject picker used across
 * Test Generator, Learning Resources, and Exam Tracker.
 *
 * When the user has subjects in their library: shows a dropdown.
 * "＋ Enter manually" reveals a separate text input (never disappears
 * mid-typing — the dropdown stays on "__custom" until the user
 * explicitly changes it).
 *
 * When there are no saved subjects: shows the text input directly.
 *
 * onChange receives the final resolved subject string.
 */

import { useEffect, useRef, useState } from "react";

export interface SubjectOption {
  _id:   string;
  name:  string;
  color: string;
  icon:  string;
}

interface Props {
  /** All resolved subject names the API returned */
  subjects:    SubjectOption[];
  /** Current value (resolved name, never "__custom") */
  value:       string;
  onChange:    (v: string) => void;
  required?:   boolean;
  placeholder?: string;
  className?:  string;
  style?:      React.CSSProperties;
}

const BASE: React.CSSProperties = {
  background: "var(--cream)",
  fontSize:   "0.9375rem",
};

export default function SubjectSelect({
  subjects, value, onChange,
  required, placeholder = "e.g. Data Structures",
  className = "input-base", style,
}: Props) {
  /* Track whether the dropdown is set to "Enter manually" */
  const isCustom  = useRef(false);
  const [custom, setCustom]     = useState("");
  const [dropVal, setDropVal]   = useState("");

  /* Sync external value → internal state (e.g. on form reset) */
  useEffect(() => {
    if (!value) {
      setDropVal("");
      setCustom("");
      isCustom.current = false;
      return;
    }
    const match = subjects.find(s => s.name === value);
    if (match) {
      setDropVal(value);
      isCustom.current = false;
    } else if (value) {
      /* value is a manually-entered name */
      setDropVal("__custom");
      setCustom(value);
      isCustom.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, subjects.length]);

  function handleDropChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setDropVal(v);
    if (v === "__custom") {
      isCustom.current = true;
      onChange(custom); // push whatever was already typed
    } else {
      isCustom.current = false;
      setCustom("");
      onChange(v);
    }
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustom(e.target.value);
    onChange(e.target.value); // parent always sees the resolved name
  }

  const merged = { ...BASE, ...style };

  /* No saved subjects → just a text input */
  if (subjects.length === 0) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={className}
        style={merged}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Dropdown */}
      <select
        value={dropVal}
        onChange={handleDropChange}
        required={required && !isCustom.current}
        className={className}
        style={merged}
      >
        <option value="">Choose subject…</option>
        {subjects.map(s => (
          <option key={s._id} value={s.name}>
            {s.icon} {s.name}
          </option>
        ))}
        <option value="__custom">＋ Enter manually</option>
      </select>

      {/* Manual entry — only shown when dropdown is on __custom */}
      {dropVal === "__custom" && (
        <input
          value={custom}
          onChange={handleCustomChange}
          placeholder={placeholder}
          autoFocus
          required={required}
          className={className}
          style={{ ...merged, borderColor: "var(--ruby)" }}
        />
      )}
    </div>
  );
}
