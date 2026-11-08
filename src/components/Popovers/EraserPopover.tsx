import React from 'react';
import { ToolSettings, EraserType } from '../../types/document';
import { Trash2, Scissors, MousePointerClick } from 'lucide-react';

interface EraserPopoverProps {
  config: ToolSettings['eraser'];
  onChange: (config: Partial<ToolSettings['eraser']>) => void;
  onClearCanvas: () => void;
  onClose: () => void;
}

export const EraserPopover: React.FC<EraserPopoverProps> = ({ config, onChange, onClearCanvas, onClose }) => {
  return (
    <div
      className="absolute left-16 top-36 z-50 w-64 rounded-xl border border-[#383633] bg-[#21201e] p-4 text-[#e8e6e3] shadow-2xl backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#33312e] pb-2">
        <span className="font-editorial-heading text-lg font-medium tracking-wide text-[#f2efe9]">
          Eraser
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f2efe9]"
          title="Close"
        >
          <span className="text-xs font-editorial-mono">✕</span>
        </button>
      </div>

      {/* Eraser Type */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[#a8a49d]">Eraser Mode</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onChange({ type: 'stroke' })}
            className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
              config.type === 'stroke'
                ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                : 'border-[#33312e] bg-[#262422] text-[#a8a49d] hover:bg-[#2c2a27]'
            }`}
          >
            <MousePointerClick size={16} />
            <span className="text-xs font-medium">Stroke Eraser</span>
            <span className="text-[10px] text-[#78716c]">Deletes entire stroke</span>
          </button>

          <button
            onClick={() => onChange({ type: 'area' })}
            className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
              config.type === 'area'
                ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                : 'border-[#33312e] bg-[#262422] text-[#a8a49d] hover:bg-[#2c2a27]'
            }`}
          >
            <Scissors size={16} />
            <span className="text-xs font-medium">Area Eraser</span>
            <span className="text-[10px] text-[#78716c]">Erases intersection</span>
          </button>
        </div>
      </div>

      {/* Size Slider */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#a8a49d]">Size</span>
          <span className="font-editorial-mono text-[11px] text-[#f2efe9]">{config.size}px</span>
        </div>
        <input
          type="range"
          min="10"
          max="80"
          value={config.size}
          onChange={(e) => onChange({ size: parseInt(e.target.value, 10) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#383633] accent-[#d6d3cd]"
        />
      </div>

      {/* Clear canvas button */}
      <button
        onClick={() => {
          if (window.confirm('Clear all drawings and ink from note?')) {
            onClearCanvas();
            onClose();
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#44403c] bg-[#292725] px-3 py-2 text-xs font-medium text-[#e11d48] hover:bg-[#383633] transition-colors"
      >
        <Trash2 size={13} />
        <span>Clear Content</span>
      </button>
    </div>
  );
};
