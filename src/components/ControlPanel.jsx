import { useState } from 'react';
import OutputTab from './OutputTab';
import EditTab from './EditTab';
import ResizeTab from './ResizeTab';
import { isSideways } from '../utils/imageProcessor';

export default function ControlPanel({
  state,
  isPng,
  targetStatus,
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
  canDownload,
}) {
  const [activeTab, setActiveTab] = useState('output');
  const sideways = isSideways(state.rotation);

  const tabs = [
    { key: 'output', label: 'Output' },
    { key: 'edit', label: 'Edit' },
    { key: 'resize', label: 'Resize' },
  ];

  return (
    <div className="controls-panel">
      <div className="panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`panel-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'output' && (
        <div className="tab-content active">
          <OutputTab
            outputFormat={state.outputFormat}
            quality={targetStatus?.quality ?? state.quality}
            targetSize={state.targetSize}
            isPng={isPng}
            targetStatus={targetStatus}
            onFormatChange={onFormatChange}
            onQualityChange={onQualityChange}
            onTargetSizeChange={onTargetSizeChange}
          />
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="tab-content active">
          <EditTab
            cropX={state.cropX}
            cropY={state.cropY}
            cropW={state.cropW}
            cropH={state.cropH}
            cropAspect={state.cropAspect}
            flippedH={sideways ? state.flippedV : state.flippedH}
            flippedV={sideways ? state.flippedH : state.flippedV}
            onCropChange={onCropChange}
            onAspectChange={onAspectChange}
            onResetCrop={onResetCrop}
            onRotateCW={onRotateCW}
            onRotateCCW={onRotateCCW}
            onFlipH={onFlipH}
            onFlipV={onFlipV}
          />
        </div>
      )}

      {activeTab === 'resize' && (
        <div className="tab-content active">
          <ResizeTab
            targetWidth={state.targetWidth}
            targetHeight={state.targetHeight}
            scale={state.scale}
            lockAspect={state.lockAspect}
            onWidthChange={onWidthChange}
            onHeightChange={onHeightChange}
            onScaleChange={onScaleChange}
            onToggleLock={onToggleLock}
            onPreset={onPreset}
          />
        </div>
      )}

      <div className="download-section">
        <button className="download-btn" disabled={!canDownload} onClick={onDownload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}
