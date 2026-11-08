import React from 'react';
import { X, BookOpen, PenTool, Layers, Keyboard } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#383633] bg-[#1e1d1b] p-6 text-[#e8e6e3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[#2d2b28] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#a8a49d]" />
            <h2 className="font-editorial-heading text-xl font-medium tracking-wide text-[#f5f4f0]">
              One Book
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-[#c7c4be]">
          <p>
            <strong className="text-[#f5f4f0]">One Book</strong> unites the fluid, pressure-sensitive
            handwriting experience of Samsung Notes with the continuous document flow of modern word
            processors and the unrestricted freedom of an infinite digital canvas.
          </p>

          <div className="rounded-xl border border-[#33312e] bg-[#242321] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[#f5f4f0] font-medium">
              <Layers size={14} className="text-[#a8a49d]" />
              <span>Three Unified Formats</span>
            </div>
            <ul className="space-y-1 text-[#a8a49d] pl-5 list-disc font-editorial-body text-[11px]">
              <li>
                <strong className="text-[#e5e2dc]">Split Pages:</strong> Discrete A4 sheets with natural margins and auto-expansion.
              </li>
              <li>
                <strong className="text-[#e5e2dc]">Infinite Scroll:</strong> Continuous connected stream of seamless A4 sheets.
              </li>
              <li>
                <strong className="text-[#e5e2dc]">Infinite Canvas:</strong> Boundless 2D spatial plane with coordinate anchoring.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#33312e] bg-[#242321] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[#f5f4f0] font-medium">
              <PenTool size={14} className="text-[#a8a49d]" />
              <span>Five Specialized Pen Engines</span>
            </div>
            <p className="text-[#a8a49d] text-[11px]">
              Fountain pen (pressure-tapered ink), Ballpoint pen (uniform precision), Marker, Graphite pencil, and expressive Brush pen.
            </p>
          </div>

          <div className="rounded-xl border border-[#33312e] bg-[#242321] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[#f5f4f0] font-medium">
              <Keyboard size={14} className="text-[#a8a49d]" />
              <span>Gestures & Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-editorial-mono text-[10px] text-[#a8a49d]">
              <div><kbd className="text-[#f5f4f0]">Ctrl + Z</kbd> Undo</div>
              <div><kbd className="text-[#f5f4f0]">Ctrl + Y</kbd> Redo</div>
              <div><kbd className="text-[#f5f4f0]">Ctrl + Scroll</kbd> Zoom Canvas</div>
              <div><kbd className="text-[#f5f4f0]">Alt / Mid-Click</kbd> Pan Canvas</div>
              <div><kbd className="text-[#f5f4f0]">Pinch / 2-Finger</kbd> Touch Zoom & Pan</div>
              <div><kbd className="text-[#f5f4f0]">Escape</kbd> Close Active Tool Panel</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-[#2d2b28] pt-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#e5e2dc] px-4 py-1.5 font-editorial-heading text-xs font-semibold text-[#1a1918] hover:bg-[#ffffff]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
