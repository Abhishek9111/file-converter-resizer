import { useRef, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import SizeCompare from './SizeCompare';
import ErrorNote from './ErrorNote';
import { formatBytes, getFormatLabel } from '../utils/imageProcessor';

export default function ImageWorkspace({
  state,
  processedSize,
  isPng,
  targetStatus,
  processing,
  error,
  onFormatChange,
  onQualityChange,
  onTargetSizeChange,
  onCropChange,
  onAspectChange,
  onResetCrop,
  onRotateCW,
  onRotateCCW,
  onFlipH,
  onFlipV,
  onWidthChange,
  onHeightChange,
  onScaleChange,
  onToggleLock,
  onPreset,
  onDownload,
  onDiscard,
  canvasRef,
}) {
  return (
    <section className="workspace active">
      <div className="preview-panel">
        <div className="file-info">
          <span className="file-name">{state.originalFile?.name}</span>
          <div className="file-meta">
            <span>{state.originalWidth} x {state.originalHeight}</span>
            <span className="meta-dot">&middot;</span>
            <span>{getFormatLabel(state.originalFile?.type)}</span>
            <span className="meta-dot">&middot;</span>
            <span>{formatBytes(state.originalSize)}</span>
          </div>
          <button className="discard-btn" onClick={onDiscard} title="Discard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="preview-container">
          <canvas ref={canvasRef} />
          {processing && (
            <div className="processing-overlay active">
              <div className="spinner" />
            </div>
          )}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}
        <SizeCompare originalSize={state.originalSize} processedSize={processedSize} />
      </div>

      <ControlPanel
        state={state}
        isPng={isPng}
        targetStatus={targetStatus}
        onFormatChange={onFormatChange}
        onQualityChange={onQualityChange}
        onTargetSizeChange={onTargetSizeChange}
        onCropChange={onCropChange}
        onAspectChange={onAspectChange}
        onResetCrop={onResetCrop}
        onRotateCW={onRotateCW}
        onRotateCCW={onRotateCCW}
        onFlipH={onFlipH}
        onFlipV={onFlipV}
        onWidthChange={onWidthChange}
        onHeightChange={onHeightChange}
        onScaleChange={onScaleChange}
        onToggleLock={onToggleLock}
        onPreset={onPreset}
        onDownload={onDownload}
        canDownload={!!state.processedBlob && !processing}
      />
    </section>
  );
}
