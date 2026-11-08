import React, { useState } from 'react';
import { ToolSettings } from '../../types/document';
import { Sparkles, Check, Minus, Plus, Star, X, ChevronUp, ChevronDown, Grid, Square } from 'lucide-react';

interface HighlighterPopoverProps {
  config: ToolSettings['highlighter'];
  onChange: (config: Partial<ToolSettings['highlighter']>) => void;
  onClose: () => void;
}

const HIGHLIGHTER_SWATCHES = [
  '#a8a29e', // Soft Stone Wash
  '#78716c', // Mid Grey Wash
  '#57534e', // Deep Charcoal Wash
  '#d6d3d1', // Light Zinc Wash
  '#d4b996', // Vintage Sepia Wash
  '#b5c4b1'  // Sage Wash
];

export const HighlighterPopover: React.FC<HighlighterPopoverProps> = ({ config, onChange, onClose }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="absolute left-16 top-16 z-50 w-72 rounded-2xl border border-[#2d2b28] bg-[#1a1918]/95 p-3.5 text-[#e8e6e3] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Utility Bar */}
      <div className="mb-3 flex items-center justify-between border-b border-[#252422] pb-2">
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
          title="Favorite"
        >
          <Star
            size={15}
            className={isFavorite ? 'fill-[#e5e2dc] text-[#e5e2dc]' : 'text-current'}
          />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Stroke Width Slider with Numerical Badge */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChange({ width: Math.max(8, config.width - 4) })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
              >
                <Minus size={13} strokeWidth={2.2} />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min="10"
                  max="64"
                  step="2"
                  value={config.width}
                  onChange={(e) => onChange({ width: parseInt(e.target.value, 10) })}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2b2927] accent-[#e5e2dc]"
                />
              </div>

              <button
                onClick={() => onChange({ width: Math.min(80, config.width + 4) })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
              >
                <Plus size={13} strokeWidth={2.2} />
              </button>

              <div className="flex h-6 min-w-8 items-center justify-center rounded-md border border-[#2d2b28] bg-[#141312] px-1 font-editorial-mono text-[11px] font-medium text-[#f5f4f0]">
                {config.width}
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] text-[#8a867f] font-editorial-mono w-14">Opacity</span>
            <input
              type="range"
              min="0.15"
              max="0.75"
              step="0.05"
              value={config.opacity}
              onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-[#2b2927] accent-[#e5e2dc]"
            />
            <div className="flex h-6 min-w-8 items-center justify-center rounded-md border border-[#2d2b28] bg-[#141312] px-1 font-editorial-mono text-[11px] font-medium text-[#f5f4f0]">
              {Math.round(config.opacity * 100)}%
            </div>
          </div>


          {/* Horizontal Color Palette Swatches */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#252422]">
            <div className="flex items-center gap-1.5">
              {HIGHLIGHTER_SWATCHES.map((hex) => {
                const isSelected = config.color.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    onClick={() => onChange({ color: hex })}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#3d3b38] transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  >
                    {isSelected && <Check size={11} strokeWidth={2.5} className="text-black" />}
                  </button>
                );
              })}
            </div>

            <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]">
              <Grid size={13} />
              <input
                type="color"
                value={config.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
