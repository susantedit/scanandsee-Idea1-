import React, { useRef, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';

export default function UploadZone({ onFileSelected, preview }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onFileSelected(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? 'var(--secondary)' : 'var(--outline-variant)'}`,
        borderRadius: 'var(--r-lg)',
        padding: 'var(--sp-12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-4)',
        cursor: 'pointer',
        transition: 'border-color var(--t-base), box-shadow var(--t-base)',
        boxShadow: isDragging ? 'var(--glow-cyan)' : 'none',
        background: isDragging ? 'var(--secondary-bg)' : 'transparent',
        minHeight: 220,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt="Selected food"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--r-lg)',
          }}
        />
      ) : (
        <>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--r-full)',
            background: 'var(--secondary-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0,219,233,0.3)',
          }}>
            <Upload size={24} color="var(--secondary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="text-body" style={{ color: 'var(--on-surface)' }}>
              Drop image here or tap to browse
            </p>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-dim)', marginTop: 4 }}>
              JPEG, PNG, WebP, HEIC — max 10MB
            </p>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
