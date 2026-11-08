import React from 'react';
import { ToolSettings, ShapeType } from '../../types/document';
import {
  Minus,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Sparkles,
  Check
} from 'lucide-react';

interface ShapesPopoverProps {
  config: ToolSettings['shapes'];
  onChange: (config: Partial<ToolSettings['shapes']>) => void;
  onClose: () => void;
}

const SHAPES: { type: ShapeType; label: string; icon: React.FC<{ size?: number }> }[] = [
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'arrow', label: 'Arrow', icon: ArrowRight },
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'rounded-rectangle', label: 'Rounded', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'triangle', label: 'Triangle', icon: Triangle },
  { type: 'polygon', label: 'Hexagon', icon: Hexagon }
];

const MONOCHROME_SWATCHES = ['#141312', '#292827', '#57534e', '#78716c', '#a8a29e', '#f5f5f4'];

export const ShapesPopover: React.FC<ShapesPopoverProps> = ({ config, onChange, onClose }) => {
  return (
    <div
      className="absolute left-16 top-48 z-50 w-72 rounded-xl border border-[#383633] bg-[#21201e] p-4 text-[#e8e6e3] shadow-2xl backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#33312e] pb-2">
        <span className="font-editorial-heading text-lg font-medium tracking-wide text-[#f2efe9]">
          Shapes & Geometry
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f2efe9]"
          title="Close"
        >
          <span className="text-xs font-editorial-mono">✕</span>
        </button>
      </div>

      {/* Shape types grid */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[#a8a49d]">Shape</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => {
            const Icon = s.icon;
            const isSelected = config.shape === s.type;
            return (
              <button
                key={s.type}
                onClick={() => onChange({ shape: s.type })}
                className={`flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${
                  isSelected
                    ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                    : 'border-[#33312e] bg-[#262422] text-[#a8a49d] hover:bg-[#2c2a27]'
                }`}
                title={s.label}
              >
                <Icon size={16} />
                <span className="mt-1 text-[10px]">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke width */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#a8a49d]">Border Width</span>
          <span className="font-editorial-mono text-[11px] text-[#f2efe9]">{config.width}px</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 8].map((w) => (
            <button
              key={w}
              onClick={() => onChange({ width: w })}
              className={`flex-1 rounded border py-1 font-editorial-mono text-xs transition-colors ${
                config.width === w
                  ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                  : 'border-[#33312e] bg-[#262422] text-[#a8a49d] hover:bg-[#2c2a27]'
              }`}
            >
              {w}px
            </button>
          ))}
        </div>
      </div>

      {/* Fill Mode */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-[#a8a49d]">Fill</label>
        <div className="flex gap-1.5">
          {(['none', 'transparent', 'solid'] as const).map((fill) => (
            <button
              key={fill}
              onClick={() => onChange({ fill })}
              className={`flex-1 rounded border py-1 text-xs capitalize transition-colors ${
                config.fill === fill
                  ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                  : 'border-[#33312e] bg-[#262422] text-[#a8a49d] hover:bg-[#2c2a27]'
              }`}
            >
              {fill === 'transparent' ? 'Tint' : fill}
            </button>
          ))}
        </div>
      </div>

      {/* Shape Recognition Toggle */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-[#33312e] bg-[#262422] px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#a8a49d]" />
          <span className="text-xs text-[#e8e6e3]">Shape Recognition</span>
        </div>
        <button
          onClick={() => onChange({ recognition: !config.recognition })}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
            config.recognition ? 'bg-[#78716c]' : 'bg-[#383633]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-[#f2efe9] shadow transition-transform ${
              config.recognition ? 'translate-x-4' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </button>
      </div>

      {/* Color swatches */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#a8a49d]">Color</label>
        <div className="flex items-center gap-1.5">
          {MONOCHROME_SWATCHES.map((hex) => {
            const isSelected = config.color.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                onClick={() => onChange({ color: hex })}
                className="relative flex h-7 w-7 items-center justify-center rounded-full border border-[#44403c] transition-transform hover:scale-105"
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {isSelected && (
                  <Check
                    size={13}
                    className={hex === '#f5f5f4' ? 'text-black' : 'text-white'}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
