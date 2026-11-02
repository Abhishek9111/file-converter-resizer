import { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadScreen from './components/UploadScreen';
import ImageWorkspace from './components/ImageWorkspace';
import ConverterResult from './components/ConverterResult';
import {
  getOutputMime, getSourceDims, getExtension, isSideways, fitDimensions,
  processImage, autoAdjustQuality,
} from './utils/imageProcessor';
import { processConversion, convertDocxToPdf } from './utils/fileConverter';

const INITIAL_STATE = {
  originalFile: null, originalImage: null,
  originalWidth: 0, originalHeight: 0, originalSize: 0,
  cropX: 0, cropY: 0, cropW: 0, cropH: 0, cropAspect: 'free',
  rotation: 0, flippedH: false, flippedV: false,
  targetWidth: 0, targetHeight: 0, lockAspect: true, aspectRatio: 1, scale: 100,
  quality: 82, outputFormat: 'original', targetSize: 0,
  processedBlob: null,
};

export default function App() {
  const [view, setView] = useState('upload');
  const [state, setState] = useState(INITIAL_STATE);
  const [processing, setProcessing] = useState(false);
  const [processedSize, setProcessedSize] = useState(null);
  const [targetStatus, setTargetStatus] = useState(null);
  const [error, setError] = useState(null);

  // Converter state
  const [converterData, setConverterData] = useState({
    title: '', output: '', result: null, mime: 'text/plain', ext: 'txt',
  });

  const canvasRef = useRef(null);
  const processRunRef = useRef(0);

  const mime = getOutputMime(state.outputFormat, state.originalFile?.type);
  const isPng = mime === 'image/png';

  // Process image whenever relevant state changes
  const doProcess = useCallback(async (run) => {
    const isStale = () => run !== processRunRef.current;

    try {
      let quality = state.quality;

      if (state.targetSize) {
        setTargetStatus((t) => ({ ...t, type: 'adjusting', message: 'Adjusting...' }));
        const target = await autoAdjustQuality(state, mime, state.targetSize);
        if (isStale()) return;
        if (target.blob) quality = target.quality;
        setTargetStatus({
          type: target.hit ? 'hit' : 'miss',
          message: target.message,
          quality: target.blob ? target.quality : undefined,
        });
      }

      const blob = await processImage(canvasRef.current, state, mime, quality);
      if (isStale()) return;
      if (!blob) throw new Error('Canvas could not be encoded');

      setState((s) => ({ ...s, processedBlob: blob }));
      setProcessedSize(blob.size);
      setError(null);
    } catch {
      if (isStale()) return;
      setState((s) => ({ ...s, processedBlob: null }));
      setProcessedSize(null);
      setTargetStatus(null);
      setError('Your browser could not process an image this large. Try smaller dimensions.');
    }
    setProcessing(false);
  }, [state.originalImage, state.cropX, state.cropY, state.cropW, state.cropH,
      state.rotation, state.flippedH, state.flippedV,
      state.targetWidth, state.targetHeight,
      state.quality, state.outputFormat, state.targetSize, mime]);

  useEffect(() => {
    const run = ++processRunRef.current;
    if (!state.originalImage) {
      setProcessing(false);
      return;
    }
    setProcessing(true);
    const timeout = setTimeout(() => doProcess(run), 150);
    return () => clearTimeout(timeout);
  }, [doProcess]);

  // Sync resize dims from crop + rotation
  function syncResize(s) {
    const dims = getSourceDims(s);
    return { ...s, targetWidth: dims.w, targetHeight: dims.h, aspectRatio: dims.w / dims.h, scale: 100 };
  }

  function clampCrop(s) {
    const cx = Math.max(0, Math.min(s.cropX, s.originalWidth - 1));
    const cy = Math.max(0, Math.min(s.cropY, s.originalHeight - 1));
    const cw = Math.max(1, Math.min(s.cropW, s.originalWidth - cx));
    const ch = Math.max(1, Math.min(s.cropH, s.originalHeight - cy));
    return { ...s, cropX: cx, cropY: cy, cropW: cw, cropH: ch };
  }

  function cropToRatio(s, ratio) {
    const r = isSideways(s.rotation) ? 1 / ratio : ratio;
    const ow = s.originalWidth, oh = s.originalHeight;
    let cw, ch;
    if (ow / oh > r) { ch = oh; cw = Math.round(oh * r); }
    else { cw = ow; ch = Math.round(ow / r); }
    return clampCrop({
      ...s,
      cropW: cw, cropH: ch,
      cropX: Math.round((ow - cw) / 2),
      cropY: Math.round((oh - ch) / 2),
    });
  }

  function rotateTo(s, rotation) {
    const next = { ...s, rotation };
    return syncResize(
      next.cropAspect === 'free' ? next : cropToRatio(next, parseFloat(next.cropAspect))
    );
  }

  // ── Image handlers ──

  function handleImageLoad(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(`${file.name} isn't an image. Use the File Converter tab for documents.`);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = syncResize({
        ...INITIAL_STATE,
        originalFile: file, originalImage: img,
        originalWidth: img.naturalWidth, originalHeight: img.naturalHeight,
        originalSize: file.size,
        cropW: img.naturalWidth, cropH: img.naturalHeight,
      });
      setState(s);
      setView('workspace');
      setTargetStatus(null);
      setProcessedSize(null);
      setError(null);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError(`${file.name} couldn't be opened. It may be corrupted, or your browser may not support this format.`);
    };
    img.src = url;
  }

  function handleDiscard() {
    setState(INITIAL_STATE);
    setView('upload');
    setProcessedSize(null);
    setTargetStatus(null);
    setError(null);
  }

  function handleFormatChange(fmt) {
    setState((s) => ({ ...s, outputFormat: fmt }));
  }

  function handleQualityChange(q) {
    setState((s) => ({ ...s, quality: q, targetSize: 0 }));
    setTargetStatus(null);
  }

  function handleTargetSizeChange(size) {
    setState((s) => ({ ...s, targetSize: size }));
    if (!size) setTargetStatus(null);
  }

  function handleCropChange(changes) {
    setState((s) => {
      const updated = { ...s, ...changes, cropAspect: 'free' };
      const clamped = clampCrop(updated);
      return syncResize(clamped);
    });
  }

  function handleAspectChange(ratio) {
    setState((s) => {
      if (ratio === 'free') {
        const reset = { ...s, cropAspect: 'free', cropX: 0, cropY: 0, cropW: s.originalWidth, cropH: s.originalHeight };
        return syncResize(reset);
      }
      return syncResize(cropToRatio({ ...s, cropAspect: ratio }, parseFloat(ratio)));
    });
  }

  function handleResetCrop() {
    setState((s) => syncResize({
      ...s, cropAspect: 'free', cropX: 0, cropY: 0,
      cropW: s.originalWidth, cropH: s.originalHeight,
    }));
  }

  function handleRotateCW() {
    setState((s) => rotateTo(s, (s.rotation + 90) % 360));
  }
  function handleRotateCCW() {
    setState((s) => rotateTo(s, (s.rotation + 270) % 360));
  }

  // Flips apply before rotation when drawing, so a sideways image swaps the axes on screen.
  function handleFlipH() {
    setState((s) => (isSideways(s.rotation)
      ? { ...s, flippedV: !s.flippedV }
      : { ...s, flippedH: !s.flippedH }));
  }
  function handleFlipV() {
    setState((s) => (isSideways(s.rotation)
      ? { ...s, flippedH: !s.flippedH }
      : { ...s, flippedV: !s.flippedV }));
  }

  function handleWidthChange(w) {
    setState((s) => {
      const dims = getSourceDims(s);
      const h = s.lockAspect ? w / s.aspectRatio : s.targetHeight;
      const fit = fitDimensions(w, h);
      return { ...s, targetWidth: fit.w, targetHeight: fit.h, scale: Math.round((fit.w / dims.w) * 100) };
    });
  }
  function handleHeightChange(h) {
    setState((s) => {
      const dims = getSourceDims(s);
      const w = s.lockAspect ? h * s.aspectRatio : s.targetWidth;
      const fit = fitDimensions(w, h);
      return { ...s, targetWidth: fit.w, targetHeight: fit.h, scale: Math.round((fit.h / dims.h) * 100) };
    });
  }
  function handleScaleChange(pct) {
    setState((s) => {
      const dims = getSourceDims(s);
      const fit = fitDimensions(dims.w * pct / 100, dims.h * pct / 100);
      return { ...s, targetWidth: fit.w, targetHeight: fit.h, scale: Math.round((fit.w / dims.w) * 100) };
    });
  }
  function handleToggleLock() {
    setState((s) => ({
      ...s, lockAspect: !s.lockAspect,
      aspectRatio: !s.lockAspect ? s.targetWidth / s.targetHeight : s.aspectRatio,
    }));
  }
  function handlePreset(w, h) {
    setState((s) => {
      const ratio = w / h;
      const cropped = syncResize(cropToRatio({ ...s, cropAspect: String(ratio) }, ratio));
      return {
        ...cropped,
        targetWidth: w, targetHeight: h, aspectRatio: ratio, lockAspect: true,
        scale: Math.round((w / cropped.targetWidth) * 100),
      };
    });
  }

  function handleDownload() {
    if (!state.processedBlob || processing) return;
    const url = URL.createObjectURL(state.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.originalFile.name.replace(/\.[^.]+$/, '') + '_fileforge.' + getExtension(state.processedBlob.type);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Converter handlers ──

  async function handleConvert(type, file, text) {
    if (type === 'docx-pdf') {
      setConverterData({ title: 'DOCX → PDF', output: 'Converting...', result: null, mime: 'application/pdf', ext: 'pdf' });
      setView('converter');
      try {
        const { blob, message } = await convertDocxToPdf(file);
        setConverterData({ title: 'DOCX → PDF', output: message, result: blob, mime: 'application/pdf', ext: 'pdf' });
      } catch (e) {
        setConverterData((d) => ({ ...d, output: 'Error: ' + e.message }));
      }
      return;
    }

    try {
      const { result, mime: m, ext, message } = processConversion(type, file, text);
      const output = message || (typeof result === 'string' ? result : '[Binary data]');
      setConverterData({ title: type.replace('-', ' → ').toUpperCase(), output, result, mime: m, ext });
      setView('converter');
    } catch (e) {
      setConverterData({ title: 'Error', output: e.message, result: null, mime: 'text/plain', ext: 'txt' });
      setView('converter');
    }
  }

  // ── Global paste and file-drop handlers ──
  useEffect(() => {
    function onPaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          handleImageLoad(item.getAsFile());
          return;
        }
      }
    }

    const hasFiles = (e) => e.dataTransfer?.types.includes('Files');

    function onDragOver(e) {
      if (hasFiles(e)) e.preventDefault();
    }

    // Drop zones call preventDefault themselves, so they are skipped here.
    function onDrop(e) {
      if (!hasFiles(e) || e.defaultPrevented) return;
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) handleImageLoad(file);
    }

    document.addEventListener('paste', onPaste);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, []);

  const showActions = view === 'workspace' || view === 'converter';

  return (
    <>
      <Header
        showActions={showActions}
        onNew={handleDiscard}
        onDiscard={handleDiscard}
      />

      {view === 'upload' && (
        <UploadScreen error={error} onImageLoad={handleImageLoad} onConvert={handleConvert} />
      )}

      {view === 'workspace' && (
        <ImageWorkspace
          state={state}
          processedSize={processedSize}
          isPng={isPng}
          targetStatus={targetStatus}
          processing={processing}
          error={error}
          canvasRef={canvasRef}
          onFormatChange={handleFormatChange}
          onQualityChange={handleQualityChange}
          onTargetSizeChange={handleTargetSizeChange}
          onCropChange={handleCropChange}
          onAspectChange={handleAspectChange}
          onResetCrop={handleResetCrop}
          onRotateCW={handleRotateCW}
          onRotateCCW={handleRotateCCW}
          onFlipH={handleFlipH}
          onFlipV={handleFlipV}
          onWidthChange={handleWidthChange}
          onHeightChange={handleHeightChange}
          onScaleChange={handleScaleChange}
          onToggleLock={handleToggleLock}
          onPreset={handlePreset}
          onDownload={handleDownload}
          onDiscard={handleDiscard}
        />
      )}

      {view === 'converter' && (
        <ConverterResult
          title={converterData.title}
          output={converterData.output}
          result={converterData.result}
          mime={converterData.mime}
          ext={converterData.ext}
          onBack={handleDiscard}
        />
      )}
    </>
  );
}
