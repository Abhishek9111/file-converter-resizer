import NumberField from './NumberField';
import { MAX_DIMENSION } from '../utils/imageProcessor';

const PRESETS = [
  { w: 1080, h: 1080, label: 'Insta Post' },
  { w: 1080, h: 1920, label: 'Insta Story' },
  { w: 1280, h: 720, label: 'YT Thumb' },
  { w: 1920, h: 1080, label: 'Full HD' },
  { w: 820, h: 312, label: 'FB Cover' },
  { w: 1500, h: 500, label: 'X Header' },
];

export default function ResizeTab({
  targetWidth, targetHeight, scale, lockAspect,
  onWidthChange, onHeightChange, onScaleChange, onToggleLock, onPreset,
}) {
  return (
    <>
      <div className="control-section">
        <div className="section-label">Dimensions</div>
        <div className="input-row">
          <div className="input-group">
            <label className="input-label">Width (px)</label>
            <NumberField max={MAX_DIMENSION} value={targetWidth} onCommit={onWidthChange} />
          </div>
          <button className={`btn-icon ${lockAspect ? 'active' : ''}`} onClick={onToggleLock} title="Lock aspect ratio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              {lockAspect
                ? <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                : <path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5" />
              }
            </svg>
          </button>
          <div className="input-group">
            <label className="input-label">Height (px)</label>
            <NumberField max={MAX_DIMENSION} value={targetHeight} onCommit={onHeightChange} />
          </div>
        </div>
        <div className="input-row">
          <div className="input-group">
            <label className="input-label">Scale (%)</label>
            <NumberField max={1000} value={scale} onCommit={onScaleChange} />
          </div>
        </div>
      </div>

      <div className="control-section">
        <div className="section-label">Quick Presets</div>
        <div className="presets-grid">
          {PRESETS.map((p) => (
            <button key={p.label} className="preset-btn" onClick={() => onPreset(p.w, p.h)}>
              {p.label}
              <span className="preset-dims">{p.w} x {p.h}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
