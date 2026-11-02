import { useState, useRef } from 'react';
import { detectConversionType } from '../utils/fileConverter';
import ErrorNote from './ErrorNote';

export default function UploadScreen({ error, onImageLoad, onConvert }) {
  const [mode, setMode] = useState('image');
  const [conversionType, setConversionType] = useState('json-csv');
  const [base64Text, setBase64Text] = useState('');
  const [unsupportedFile, setUnsupportedFile] = useState(null);
  const imageInputRef = useRef(null);
  const converterInputRef = useRef(null);

  const showBase64Input = conversionType === 'base64-decode';

  function handleImageDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length) onImageLoad(e.dataTransfer.files[0]);
  }

  function handleConverterFile(file) {
    setUnsupportedFile(null);

    const type = conversionType === 'base64-encode'
      ? conversionType
      : detectConversionType(file.name);

    if (!type) {
      setUnsupportedFile(file.name.split('.').pop().toLowerCase());
      return;
    }

    setConversionType(type);

    if (type === 'docx-pdf') {
      onConvert(type, file, null);
    } else if (type === 'base64-encode') {
      const reader = new FileReader();
      reader.onload = () => onConvert(type, file, reader.result);
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => onConvert(type, file, reader.result);
      reader.readAsText(file);
    }
  }

  function handleBase64Input(text) {
    setBase64Text(text);
    if (text.trim().length > 10) {
      onConvert('base64-decode', null, text);
    }
  }

  return (
    <section className="upload-section">
      <div className="upload-inner">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'image' ? 'active' : ''}`}
            onClick={() => setMode('image')}
          >
            Image Tools
          </button>
          <button
            className={`mode-tab ${mode === 'convert' ? 'active' : ''}`}
            onClick={() => setMode('convert')}
          >
            File Converter
          </button>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {/* Image upload */}
        {mode === 'image' && (
          <div>
            <input
              ref={imageInputRef}
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files.length) onImageLoad(e.target.files[0]);
                e.target.value = '';
              }}
            />
            <div
              className="upload-zone"
              onClick={() => imageInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={handleImageDrop}
            >
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div className="upload-title">Drop your image here</div>
              <div className="upload-subtitle">or click to browse</div>
              <div className="upload-formats">
                {['PNG', 'JPG', 'WebP', 'GIF', 'BMP'].map((f) => (
                  <span key={f} className="format-tag">{f}</span>
                ))}
              </div>
            </div>
            <div className="privacy-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Everything runs locally — files never leave your device
            </div>
          </div>
        )}

        {/* File converter upload */}
        {mode === 'convert' && (
          <div className="converter-card">
            <h3>Choose conversion or drop any supported file</h3>
            <select
              className="select-field"
              value={conversionType}
              onChange={(e) => { setConversionType(e.target.value); setUnsupportedFile(null); }}
              style={{ marginBottom: 12 }}
            >
              <option value="json-csv">JSON → CSV</option>
              <option value="csv-json">CSV → JSON</option>
              <option value="md-html">Markdown → HTML</option>
              <option value="base64-encode">File → Base64</option>
              <option value="base64-decode">Base64 → File</option>
              <option value="docx-pdf">DOCX → PDF</option>
            </select>

            {unsupportedFile && (
              <ErrorNote>
                .{unsupportedFile} files aren't supported yet. Try JSON, CSV, MD, TXT, or DOCX — or choose File → Base64 for any file.
              </ErrorNote>
            )}

            {showBase64Input ? (
              <div>
                <label className="input-label">Paste Base64 string</label>
                <textarea
                  className="input-field"
                  value={base64Text}
                  onChange={(e) => handleBase64Input(e.target.value)}
                  placeholder="Paste base64-encoded content here..."
                  style={{ minHeight: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            ) : (
              <>
                <input
                  ref={converterInputRef}
                  type="file"
                  className="file-input"
                  onChange={(e) => {
                    if (e.target.files.length) handleConverterFile(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
                <div
                  className="upload-zone"
                  style={{ padding: '32px 20px' }}
                  onClick={() => converterInputRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    if (e.dataTransfer.files.length) handleConverterFile(e.dataTransfer.files[0]);
                  }}
                >
                  <div className="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="upload-title">Drop your file here</div>
                  <div className="upload-subtitle">Auto-detects JSON, CSV, Markdown, DOCX</div>
                  <div className="upload-formats">
                    {['JSON', 'CSV', 'MD', 'TXT', 'DOCX'].map((f) => (
                      <span key={f} className="format-tag">{f}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
