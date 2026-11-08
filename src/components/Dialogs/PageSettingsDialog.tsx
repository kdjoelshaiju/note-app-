import React, { useRef } from 'react';
import {
  PageSettings,
  PageOrientation,
  PaperColor,
  TemplateType,
  TemplateVariation
} from '../../types/document';
import { db } from '../../storage/db';
import { Check, Upload, Trash2, X } from 'lucide-react';

interface PageSettingsDialogProps {
  isOpen: boolean;
  settings: PageSettings;
  onUpdate: (settings: Partial<PageSettings>) => void;
  onClose: () => void;
  onCustomImageLoaded?: (img: HTMLImageElement | null) => void;
}

const PAPER_COLORS: { label: string; hex: PaperColor; isDark: boolean }[] = [
  { label: 'Pure White', hex: '#ffffff', isDark: false },
  { label: 'Cream', hex: '#fbfbf8', isDark: false },
  { label: 'Light Grey', hex: '#f2f1ee', isDark: false },
  { label: 'Medium Grey', hex: '#d6d4ce', isDark: false },
  { label: 'Dark Charcoal', hex: '#292827', isDark: true },
  { label: 'Obsidian Black', hex: '#141312', isDark: true }
];

const TEMPLATES: { type: TemplateType; label: string; variations?: TemplateVariation[] }[] = [
  { type: 'lined', label: 'Lined Paper', variations: ['standard', 'narrow', 'wide'] },
  { type: 'grid', label: 'Grid Paper', variations: ['standard', 'narrow', 'wide'] },
  { type: 'dot', label: 'Dot Grid', variations: ['standard', 'narrow', 'wide'] },
  { type: 'oxford', label: 'Oxford Margin' },
  { type: 'blank', label: 'Blank Sheet' },
  { type: 'custom', label: 'Custom Template' }
];

export const PageSettingsDialog: React.FC<PageSettingsDialogProps> = ({
  isOpen,
  settings,
  onUpdate,
  onClose,
  onCustomImageLoaded
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const assetId = `custom-tpl-${Date.now()}`;
      await db.templates.put({
        id: assetId,
        name: file.name,
        dataUrl,
        createdAt: Date.now()
      });

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        onCustomImageLoaded?.(img);
      };

      onUpdate({
        template: {
          type: 'custom',
          customAssetId: assetId,
          customImageData: dataUrl
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeCustomTemplate = () => {
    onCustomImageLoaded?.(null);
    onUpdate({
      template: {
        type: 'lined',
        variation: 'standard'
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#383633] bg-[#1e1d1b] p-6 text-[#e8e6e3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#2d2b28] pb-3">
          <div>
            <h2 className="font-editorial-heading text-xl font-medium tracking-wide text-[#f5f4f0]">
              Page & Template Settings
            </h2>
            <p className="font-editorial-mono text-[11px] text-[#8f8b85]">
              Configure paper proportions, rulings, and texture
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0]"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Page Orientation */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium text-[#a8a49d]">
            Orientation (A4 Standard)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['portrait', 'landscape'] as PageOrientation[]).map((orient) => {
              const isSelected = settings.orientation === orient;
              return (
                <button
                  key={orient}
                  onClick={() => onUpdate({ orientation: orient })}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs capitalize transition-colors ${
                    isSelected
                      ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                      : 'border-[#33312e] bg-[#242321] text-[#a8a49d] hover:bg-[#2c2a27]'
                  }`}
                >
                  <span className="font-editorial-body font-medium">{orient}</span>
                  <span className="font-editorial-mono text-[10px] text-[#78716c]">
                    {orient === 'portrait' ? '210 × 297 mm' : '297 × 210 mm'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Paper Colour */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium text-[#a8a49d]">Paper Colour</label>
          <div className="grid grid-cols-3 gap-2">
            {PAPER_COLORS.map((color) => {
              const isSelected = settings.backgroundColor.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.hex}
                  onClick={() => onUpdate({ backgroundColor: color.hex })}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
                    isSelected
                      ? 'border-[#78716c] bg-[#33312e]'
                      : 'border-[#33312e] bg-[#242321] hover:bg-[#2c2a27]'
                  }`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#44403c]"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check size={11} className={color.isDark ? 'text-white' : 'text-black'} />
                    )}
                  </span>
                  <span className="text-xs text-[#e8e6e3]">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Page Template */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium text-[#a8a49d]">Template</label>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((tpl) => {
              const isSelected = settings.template.type === tpl.type;
              return (
                <button
                  key={tpl.type}
                  onClick={() =>
                    onUpdate({
                      template: {
                        ...settings.template,
                        type: tpl.type,
                        variation: tpl.variations ? settings.template.variation || 'standard' : undefined
                      }
                    })
                  }
                  className={`flex flex-col items-start rounded-xl border p-2.5 transition-colors ${
                    isSelected
                      ? 'border-[#78716c] bg-[#33312e] text-[#f5f4f0]'
                      : 'border-[#33312e] bg-[#242321] text-[#a8a49d] hover:bg-[#2c2a27]'
                  }`}
                >
                  <span className="text-xs font-semibold">{tpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* Variations (Standard / Narrow / Wide) if applicable */}
          {['lined', 'grid', 'dot'].includes(settings.template.type) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#33312e] bg-[#242321] p-2">
              <span className="text-xs text-[#a8a49d]">Spacing:</span>
              {(['narrow', 'standard', 'wide'] as TemplateVariation[]).map((variation) => {
                const isCur = (settings.template.variation || 'standard') === variation;
                return (
                  <button
                    key={variation}
                    onClick={() =>
                      onUpdate({
                        template: {
                          ...settings.template,
                          variation
                        }
                      })
                    }
                    className={`rounded px-2.5 py-1 font-editorial-mono text-[11px] capitalize transition-colors ${
                      isCur
                        ? 'bg-[#383633] text-[#f5f4f0]'
                        : 'text-[#8f8b85] hover:text-[#e8e6e3]'
                    }`}
                  >
                    {variation}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom Template Upload section */}
          {settings.template.type === 'custom' && (
            <div className="mt-3 rounded-xl border border-[#383633] bg-[#242321] p-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a8a49d]">Import Background Asset (PNG/JPG)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-[#44403c] bg-[#2c2a27] px-3 py-1.5 text-xs font-medium text-[#f5f4f0] hover:bg-[#383633]"
                  >
                    <Upload size={13} />
                    <span>Upload File</span>
                  </button>
                  {settings.template.customImageData && (
                    <button
                      onClick={removeCustomTemplate}
                      className="flex items-center gap-1 rounded-lg border border-[#44403c] bg-[#2c2a27] px-2 py-1.5 text-xs text-[#f43f5e] hover:bg-[#383633]"
                      title="Remove custom template"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              {settings.template.customImageData && (
                <div className="mt-2 h-20 overflow-hidden rounded-lg border border-[#383633] bg-white">
                  <img
                    src={settings.template.customImageData}
                    alt="Custom template preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#e5e2dc] px-5 py-2 font-editorial-heading text-sm font-semibold text-[#1a1918] transition-colors hover:bg-[#ffffff]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
