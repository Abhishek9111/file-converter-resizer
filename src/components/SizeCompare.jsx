import { formatBytes } from '../utils/imageProcessor';

export default function SizeCompare({ originalSize, processedSize }) {
  if (!processedSize) return null;

  const ratio = processedSize / originalSize;
  const percent = Math.round((1 - ratio) * 100);
  const reduced = ratio <= 1;

  return (
    <div className="size-compare">
      <span className="size-original">{formatBytes(originalSize)}</span>
      <div className="size-bar">
        <div
          className={`size-bar-fill ${reduced ? 'reduced' : 'increased'}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <span className="size-result">{formatBytes(processedSize)}</span>
      <span className={`size-savings ${percent > 0 ? 'positive' : percent < 0 ? 'negative' : ''}`}>
        {percent > 0 ? `-${percent}%` : percent < 0 ? `+${Math.abs(percent)}%` : '0%'}
      </span>
    </div>
  );
}
