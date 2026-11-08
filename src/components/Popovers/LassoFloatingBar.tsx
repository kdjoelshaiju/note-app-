import React from 'react';
import { Copy, Trash2, X, Move } from 'lucide-react';

interface LassoFloatingBarProps {
  bounds: { x: number; y: number; width: number; height: number };
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  screenPos: { x: number; y: number };
}

export const LassoFloatingBar: React.FC<LassoFloatingBarProps> = ({
  onDuplicate,
  onDelete,
  onDeselect,
  screenPos
}) => {
  return (
    <div
      className="fixed z-50 flex items-center gap-1.5 rounded-lg border border-[#44403c] bg-[#1c1a18] px-2 py-1.5 shadow-2xl backdrop-blur-md"
      style={{
        left: Math.max(80, Math.min(window.innerWidth - 220, screenPos.x)),
        top: Math.max(60, screenPos.y - 45)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 border-r border-[#33312e] pr-1.5 text-xs text-[#a8a49d]">
        <Move size={12} />
        <span className="font-editorial-mono text-[10px]">Select</span>
      </div>

      <button
        onClick={onDuplicate}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#e5e2dc] hover:bg-[#2c2a27]"
        title="Duplicate"
      >
        <Copy size={13} />
        <span>Duplicate</span>
      </button>

      <button
        onClick={onDelete}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#f43f5e] hover:bg-[#2c2a27]"
        title="Delete"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>

      <button
        onClick={onDeselect}
        className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f2efe9]"
        title="Deselect"
      >
        <X size={13} />
      </button>
    </div>
  );
};
