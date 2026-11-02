import NumberField from './NumberField';

const ASPECT_RATIOS = [
  { key: 'free', label: 'Free' },
  { key: '1', label: '1:1' },
  { key: '1.3333', label: '4:3' },
  { key: '1.7778', label: '16:9' },
  { key: '1.5', label: '3:2' },
];

export default function EditTab({
  cropX, cropY, cropW, cropH, cropAspect,
  flippedH, flippedV,
  onCropChange, onAspectChange, onResetCrop,
  onRotateCW, onRotateCCW, onFlipH, onFlipV,
}) {
  return (
    <>
      <div className="control-section">
        <div className="section-label">Crop</div>
        <div className="aspect-pills">
          {ASPECT_RATIOS.map((a) => (
            <button
              key={a.key}
              className={`aspect-pill ${cropAspect === a.key ? 'active' : ''}`}
              onClick={() => onAspectChange(a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="input-row">
          <div className="input-group">
            <label className="input-label">X</label>
            <NumberField min={0} value={cropX} onCommit={(v) => onCropChange({ cropX: v })} />
          </div>
          <div className="input-group">
            <label className="input-label">Y</label>
            <NumberField min={0} value={cropY} onCommit={(v) => onCropChange({ cropY: v })} />
          </div>
        </div>
        <div className="input-row">
          <div className="input-group">
            <label className="input-label">Width</label>
            <NumberField min={1} value={cropW} onCommit={(v) => onCropChange({ cropW: v })} />
          </div>
          <div className="input-group">
            <label className="input-label">Height</label>
            <NumberField min={1} value={cropH} onCommit={(v) => onCropChange({ cropH: v })} />
          </div>
        </div>
        <button className="text-link" onClick={onResetCrop} style={{ marginTop: 4 }}>Reset to full image</button>
      </div>

      <div className="control-section">
        <div className="section-label">Rotate & Flip</div>
        <div className="transform-row">
          <button className="btn-icon" onClick={onRotateCCW} title="Rotate left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button className="btn-icon" onClick={onRotateCW} title="Rotate right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button className={`btn-icon ${flippedH ? 'active' : ''}`} onClick={onFlipH} title="Flip horizontal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 3l5 9-5 9" /><path d="M8 3L3 12l5 9" />
              <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
            </svg>
          </button>
          <button className={`btn-icon ${flippedV ? 'active' : ''}`} onClick={onFlipV} title="Flip vertical">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8l9-5 9 5" /><path d="M3 16l9 5 9-5" />
              <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
