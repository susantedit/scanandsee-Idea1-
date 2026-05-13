import React from 'react';

export default function ScanInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
  required,
  min,
  max,
}) {
  return (
    <div className="scan-input-wrap">
      {label && (
        <label className="scan-input-label" htmlFor={name}>
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="scan-input"
        autoComplete="off"
      />
    </div>
  );
}
