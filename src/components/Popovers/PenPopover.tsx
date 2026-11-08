import React, { useState } from 'react';
import { LineType, PenToolType, ToolSettings } from '../../types/document';
import {
  Minus,
  Plus,
  Check,
  Sparkles,
  Star,
  ChevronUp,
  ChevronDown,
  X,
  Pipette,
  Grid,
  Square
} from 'lucide-react';

interface PenPopoverProps {
  config: ToolSettings['pen'];
  onChange: (config: Partial<ToolSettings['pen']>) => void;
  onClose: () => void;
}

// Stylized visual pen illustrations inspired by Samsung Notes
const PEN_NIB_ICONS: Record<PenToolType, (active: boolean) => React.ReactNode> = {
  fountain: (active) => (
    <svg viewBox="0 0 24 36" className="w-5 h-8 transition-transform group-hover:scale-105" fill="none">
      {/* Fountain Pen: tapered metallic nib with slit and breather hole */}
      <path
        d="M6 2 L18 2 L17 18 L12 34 L7 18 Z"
        fill={active ? '#f5f4f0' : '#8c8882'}
        stroke={active ? '#ffffff' : '#6b6761'}
        strokeWidth="1.2"
      />
      <circle cx="12" cy="18" r="1.5" fill={active ? '#1c1b19' : '#383633'} />
      <line x1="12" y1="18" x2="12" y2="34" stroke={active ? '#1c1b19' : '#383633'} strokeWidth="1.2" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={active ? '#383633' : '#262523'} strokeWidth="1" />
    </svg>
  ),
  ballpoint: (active) => (
    <svg viewBox="0 0 24 36" className="w-5 h-8 transition-transform group-hover:scale-105" fill="none">
      {/* Ballpoint: sleek technical cylindrical barrel with conical tip */}
      <rect x="7" y="2" width="10" height="20" rx="1.5" fill={active ? '#f5f4f0' : '#8c8882'} />
      <path d="M7 22 L17 22 L13.5 32 L10.5 32 Z" fill={active ? '#e5e2dc' : '#736f69'} />
      <circle cx="12" cy="33.5" r="1.2" fill={active ? '#ffffff' : '#a8a49d'} />
      <rect x="9" y="5" width="6" height="4" rx="0.5" fill={active ? '#2b2927' : '#3d3b38'} />
    </svg>
  ),
  marker: (active) => (
    <svg viewBox="0 0 24 36" className="w-5 h-8 transition-transform group-hover:scale-105" fill="none">
      {/* Marker: robust broad barrel with angled chisel tip */}
      <rect x="6" y="2" width="12" height="22" rx="2" fill={active ? '#f5f4f0' : '#8c8882'} />
      <path d="M8 24 L16 24 L15 33 L9 30 Z" fill={active ? '#e5e2dc' : '#736f69'} />
      <line x1="7" y1="8" x2="17" y2="8" stroke={active ? '#2b2927' : '#3d3b38'} strokeWidth="1.5" />
    </svg>
  ),
  pencil: (active) => (
    <svg viewBox="0 0 24 36" className="w-5 h-8 transition-transform group-hover:scale-105" fill="none">
      {/* Pencil: hexagonal wooden shaft with sharpened cedar core and lead tip */}
      <rect x="7" y="2" width="10" height="18" fill={active ? '#f5f4f0' : '#8c8882'} />
      <line x1="10.5" y1="2" x2="10.5" y2="20" stroke={active ? '#c7c4be' : '#57534e'} strokeWidth="1" />
      <line x1="13.5" y1="2" x2="13.5" y2="20" stroke={active ? '#c7c4be' : '#57534e'} strokeWidth="1" />
      <path d="M7 20 L17 20 L12 30 Z" fill={active ? '#e7cbb2' : '#8a7868'} />
      <polygon points="12,34 10.5,30 13.5,30" fill={active ? '#1c1b19' : '#33312e'} />
    </svg>
  ),
  brush: (active) => (
    <svg viewBox="0 0 24 36" className="w-5 h-8 transition-transform group-hover:scale-105" fill="none">
      {/* Brush: tapered ferrule with flowing organic bristle hair */}
      <rect x="7.5" y="2" width="9" height="15" rx="1" fill={active ? '#f5f4f0' : '#8c8882'} />
      <rect x="8.5" y="17" width="7" height="4" fill={active ? '#b8b4ad' : '#5e5a55'} />
      <path d="M8.5 21 C8.5 25, 9.5 32, 12 35 C14.5 32, 15.5 25, 15.5 21 Z" fill={active ? '#383633' : '#222120'} />
      <path d="M11 21 L12 31 L13 21" stroke={active ? '#6b6761' : '#474440'} strokeWidth="0.8" />
    </svg>
  )
};

const PEN_PRESET_TYPES: PenToolType[] = ['fountain', 'ballpoint', 'marker', 'pencil', 'brush'];

const LINE_TYPES: { type: LineType; title: string }[] = [
  { type: 'uniform', title: 'Uniform' },
  { type: 'pressure-variable', title: 'Pressure Variable' },
  { type: 'dotted', title: 'Dotted' },
  { type: 'dashed', title: 'Dashed' }
];

const MONOCHROME_PALETTE = [
  '#141312', // Pure Black
  '#282624', // Charcoal
  '#57534e', // Deep Stone
  '#78716c', // Mid Grey
  '#a8a29e', // Soft Grey
  '#f5f5f4'  // Off White
];

export const PenPopover: React.FC<PenPopoverProps> = ({ config, onChange, onClose }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleWidthChange = (val: number) => {
    onChange({ width: Math.max(1, Math.min(30, Number(val.toFixed(1)))) });
  };

  const handleEyedropper = async () => {
    // Standard EyeDropper API where supported
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChange({ color: result.sRGBHex });
        }
      } catch (err) {
        // User canceled eyedropper
      }
    } else {
      alert('Eyedropper is not supported on this browser platform.');
    }
  };

  const activeLineType = config.lineType || 'pressure-variable';

  return (
    <div
      className="absolute left-16 top-10 z-50 w-72 rounded-2xl border border-[#2d2b28] bg-[#1a1918]/95 p-3.5 text-[#e8e6e3] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Utility Bar: Star Favorite, Collapse, and Close 'X' */}
      <div className="mb-3 flex items-center justify-between border-b border-[#252422] pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Favorite preset"
          >
            <Star
              size={15}
              className={isFavorite ? 'fill-[#e5e2dc] text-[#e5e2dc]' : 'text-current'}
            />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
            title={isCollapsed ? 'Expand' : 'Collapse'}
            aria-label="Collapse"
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
            title="Close"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 1. Horizontal Shelf of Stylized Tool Nib Icons (Samsung Notes style) */}
      <div className="mb-3.5 flex items-center justify-between gap-1 rounded-xl bg-[#141312] p-1.5 border border-[#242321]">
        {PEN_PRESET_TYPES.map((type) => {
          const isActive = config.preset === type;
          return (
            <button
              key={type}
              onClick={() => onChange({ preset: type })}
              className={`group flex h-14 flex-1 items-center justify-center rounded-lg transition-all ${
                isActive
                  ? 'bg-[#292725] shadow-sm ring-1 ring-[#57534e]'
                  : 'hover:bg-[#1f1e1c]'
              }`}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              aria-label={type}
            >
              {PEN_NIB_ICONS[type](isActive)}
            </button>
          );
        })}
      </div>

      {!isCollapsed && (
        <>
          {/* 2. Compact Visual Line Type Selectors */}
          <div className="mb-3.5 flex items-center justify-between gap-1 rounded-xl bg-[#141312] p-1 border border-[#242321]">
            {LINE_TYPES.map((lt) => {
              const isSelected = activeLineType === lt.type;
              return (
                <button
                  key={lt.type}
                  onClick={() => onChange({ lineType: lt.type })}
                  className={`flex h-7 flex-1 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#292725] text-[#f5f4f0] shadow-sm'
                      : 'text-[#8a867f] hover:text-[#d6d3cd]'
                  }`}
                  title={lt.title}
                  aria-label={lt.title}
                >
                  {lt.type === 'uniform' && (
                    <svg className="w-8 h-2 text-current" viewBox="0 0 32 8">
                      <line x1="2" y1="4" x2="30" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {lt.type === 'pressure-variable' && (
                    <svg className="w-8 h-2 text-current" viewBox="0 0 32 8">
                      <path d="M 2 4 Q 12 1, 20 5 T 30 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                  {lt.type === 'dotted' && (
                    <svg className="w-8 h-2 text-current" viewBox="0 0 32 8">
                      <line x1="2" y1="4" x2="30" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 5" />
                    </svg>
                  )}
                  {lt.type === 'dashed' && (
                    <svg className="w-8 h-2 text-current" viewBox="0 0 32 8">
                      <line x1="2" y1="4" x2="30" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 4" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Minimalist Stroke Width Slider with Numerical Badge */}
          <div className="mb-3.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleWidthChange(config.width - 0.5)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
                title="Decrease"
                aria-label="Decrease width"
              >
                <Minus size={13} strokeWidth={2.2} />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.5"
                  value={config.width}
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2b2927] accent-[#e5e2dc]"
                />
              </div>

              <button
                onClick={() => handleWidthChange(config.width + 0.5)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
                title="Increase"
                aria-label="Increase width"
              >
                <Plus size={13} strokeWidth={2.2} />
              </button>

              {/* Numerical Badge */}
              <div className="flex h-6 min-w-8 items-center justify-center rounded-md border border-[#2d2b28] bg-[#141312] px-1 font-editorial-mono text-[11px] font-medium text-[#f5f4f0]">
                {config.width}
              </div>
            </div>
          </div>


          {/* 5. Horizontal Color Palette Swatches with Eyedropper and Custom Grid Picker */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#252422]">
            {/* Color Swatch Circles */}
            <div className="flex items-center gap-1.5">
              {MONOCHROME_PALETTE.map((hex) => {
                const isSelected = config.color.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    onClick={() => onChange({ color: hex })}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#3d3b38] transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                    title={hex}
                    aria-label={`Color ${hex}`}
                  >
                    {isSelected && (
                      <Check
                        size={11}
                        strokeWidth={2.5}
                        className={hex === '#f5f5f4' ? 'text-black' : 'text-white'}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Utility Color Tools: Eyedropper & Palette Picker */}
            <div className="flex items-center gap-1 border-l border-[#252422] pl-1.5">
              <button
                onClick={handleEyedropper}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
                title="Eyedropper"
                aria-label="Eyedropper"
              >
                <Pipette size={13} />
              </button>

              <label
                className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#8a867f] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
                title="Custom color"
                aria-label="Custom color"
              >
                <Grid size={13} />
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
