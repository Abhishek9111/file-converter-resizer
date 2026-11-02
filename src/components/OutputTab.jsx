const FORMATS = [
  { key: 'original', label: 'Original' },
  { key: 'image/png', label: 'PNG' },
  { key: 'image/jpeg', label: 'JPG' },
  { key: 'image/webp', label: 'WebP' },
];

const TARGET_SIZES = [
  { value: 0, label: 'No limit' },
  { value: 25600, label: '25 KB' },
  { value: 51200, label: '50 KB' },
  { value: 102400, label: '100 KB' },
  { value: 256000, label: '250 KB' },
  { value: 512000, label: '500 KB' },
  { value: 1048576, label: '1 MB' },
  { value: 2097152, label: '2 MB' },
  { value: 5242880, label: '5 MB' },
];

export default function OutputTab({
  outputFormat, quality, targetSize, isPng,
  targetStatus,
  onFormatChange, onQualityChange, onTargetSizeChange,
}) {
  const supportsQuality = !isPng;

  return (
    <>
      <div className="control-section">
        <div className="section-label">Format</div>
        <div className="format-selector">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              className={`format-btn ${outputFormat === f.key ? 'active' : ''}`}
              onClick={() => onFormatChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="section-label">Quality</div>
        {supportsQuality ? (
          <div className="slider-row">
            <input
              type="range"
              className="slider"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => onQualityChange(parseInt(e.target.value))}
            />
            <span className="slider-value">{quality}</span>
          </div>
        ) : (
          <div className="quality-note">PNG is lossless — switch to JPG or WebP to compress.</div>
        )}
      </div>

      <div className="control-section">
        <div className="section-label">Target Size</div>
        <select
          className="select-field"
          value={targetSize}
          onChange={(e) => onTargetSizeChange(parseInt(e.target.value))}
        >
          {TARGET_SIZES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {targetStatus && (
          <div className={`target-status ${targetStatus.type}`}>
            {targetStatus.type === 'hit' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            )}
            {targetStatus.type === 'miss' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            )}
            {targetStatus.message}
          </div>
        )}
      </div>
    </>
  );
}
