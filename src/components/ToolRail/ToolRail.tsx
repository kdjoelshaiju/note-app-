import React from 'react';
import {
  Type,
  PenTool as PenIcon,
  Highlighter,
  Eraser,
  Lasso,
  Shapes,
  Undo2,
  Redo2
} from 'lucide-react';
import { ActiveTool, ToolSettings } from '../../types/document';
import { PenPopover } from '../Popovers/PenPopover';
import { HighlighterPopover } from '../Popovers/HighlighterPopover';
import { EraserPopover } from '../Popovers/EraserPopover';
import { ShapesPopover } from '../Popovers/ShapesPopover';

interface ToolRailProps {
  tools: ToolSettings;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: ActiveTool) => void;
  onTogglePopover: (tool: ActiveTool) => void;
  onClosePopover: () => void;
  onUpdatePen: (cfg: Partial<ToolSettings['pen']>) => void;
  onUpdateHighlighter: (cfg: Partial<ToolSettings['highlighter']>) => void;
  onUpdateEraser: (cfg: Partial<ToolSettings['eraser']>) => void;
  onUpdateShapes: (cfg: Partial<ToolSettings['shapes']>) => void;
  onClearCanvas: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const QUICK_COLORS = ['#141312', '#292827', '#78716c', '#a8a29e', '#f5f5f4'];
const QUICK_WIDTH_VALUES = [2, 4, 8, 14];

export const ToolRail: React.FC<ToolRailProps> = ({
  tools,
  canUndo,
  canRedo,
  onSelectTool,
  onTogglePopover,
  onClosePopover,
  onUpdatePen,
  onUpdateHighlighter,
  onUpdateEraser,
  onUpdateShapes,
  onClearCanvas,
  onUndo,
  onRedo
}) => {
  const handleToolClick = (tool: ActiveTool) => {
    if (tools.activeTool === tool) {
      // Toggle popover if clicking already active tool
      onTogglePopover(tool);
    } else {
      onSelectTool(tool);
    }
  };

  const handleQuickColor = (color: string) => {
    if (tools.activeTool === 'pen') {
      onUpdatePen({ color });
    } else if (tools.activeTool === 'highlighter') {
      onUpdateHighlighter({ color });
    } else if (tools.activeTool === 'shapes') {
      onUpdateShapes({ color });
    }
  };

  const handleQuickWidth = (width: number) => {
    if (tools.activeTool === 'pen') {
      onUpdatePen({ width });
    } else if (tools.activeTool === 'highlighter') {
      onUpdateHighlighter({ width: width * 3 });
    } else if (tools.activeTool === 'eraser') {
      onUpdateEraser({ size: width * 4 });
    } else if (tools.activeTool === 'shapes') {
      onUpdateShapes({ width });
    }
  };

  return (
    <aside
      className="relative z-40 flex h-full w-12 flex-col items-center justify-between border-r border-[#222120] bg-[#141312] py-2.5 text-[#d6d3cd] select-none transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Tools Stack */}
      <div className="flex flex-col items-center gap-1">
        {/* Keyboard / Text */}
        <button
          onClick={() => handleToolClick('text')}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'text'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Text mode"
          aria-label="Text mode"
        >
          <Type size={17} strokeWidth={1.8} />
        </button>

        {/* Pen */}
        <button
          onClick={() => handleToolClick('pen')}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'pen'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Pen (tap again for settings)"
          aria-label="Pen"
        >
          <PenIcon size={17} strokeWidth={1.8} />
          {/* Subtle color pip */}
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: tools.pen.color }}
          />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => handleToolClick('highlighter')}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'highlighter'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Highlighter"
          aria-label="Highlighter"
        >
          <Highlighter size={17} strokeWidth={1.8} />
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: tools.highlighter.color }}
          />
        </button>

        {/* Eraser */}
        <button
          onClick={() => handleToolClick('eraser')}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'eraser'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Eraser"
          aria-label="Eraser"
        >
          <Eraser size={17} strokeWidth={1.8} />
        </button>

        {/* Lasso */}
        <button
          onClick={() => handleToolClick('lasso')}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'lasso'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Lasso select"
          aria-label="Lasso select"
        >
          <Lasso size={17} strokeWidth={1.8} />
        </button>

        {/* Shapes */}
        <button
          onClick={() => handleToolClick('shapes')}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            tools.activeTool === 'shapes'
              ? 'bg-[#252422] text-[#f5f4f0]'
              : 'text-[#8f8b85] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
          }`}
          title="Shapes and lines"
          aria-label="Shapes and lines"
        >
          <Shapes size={17} strokeWidth={1.8} />
        </button>

        {/* Hairline Separator */}
        <div className="my-1.5 h-[1px] w-6 bg-[#222120]" />

        {/* Quick Color Swatches */}
        <div className="flex flex-col items-center gap-1.5">
          {QUICK_COLORS.map((hex) => {
            const activeColor =
              tools.activeTool === 'pen'
                ? tools.pen.color
                : tools.activeTool === 'highlighter'
                ? tools.highlighter.color
                : tools.shapes.color;
            const isCur = activeColor.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                onClick={() => handleQuickColor(hex)}
                className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
                  isCur ? 'border-[#f2efe9] ring-1 ring-[#57534e]' : 'border-[#383633]'
                }`}
                style={{ backgroundColor: hex }}
                title={`Color ${hex}`}
                aria-label={`Color ${hex}`}
              />
            );
          })}
        </div>

        {/* Hairline Separator */}
        <div className="my-1.5 h-[1px] w-6 bg-[#222120]" />

        {/* Quick Stroke Width Dots (no text labels!) */}
        <div className="flex flex-col items-center gap-1.5">
          {QUICK_WIDTH_VALUES.map((val) => (
            <button
              key={val}
              onClick={() => handleQuickWidth(val)}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#1f1e1c]"
              title={`${val}px stroke`}
              aria-label={`${val}px stroke`}
            >
              <span
                className="rounded-full bg-[#8f8b85] transition-all hover:bg-[#f5f4f0]"
                style={{
                  width: Math.min(10, Math.max(2.5, val * 0.7)),
                  height: Math.min(10, Math.max(2.5, val * 0.7))
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Undo / Redo */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            canUndo
              ? 'text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#f5f4f0]'
              : 'cursor-not-allowed text-[#33312e]'
          }`}
          title="Undo"
          aria-label="Undo"
        >
          <Undo2 size={15} strokeWidth={1.8} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            canRedo
              ? 'text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#f5f4f0]'
              : 'cursor-not-allowed text-[#33312e]'
          }`}
          title="Redo"
          aria-label="Redo"
        >
          <Redo2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Floating Popovers */}
      {tools.activePopover === 'pen' && (
        <PenPopover
          config={tools.pen}
          onChange={onUpdatePen}
          onClose={onClosePopover}
        />
      )}

      {tools.activePopover === 'highlighter' && (
        <HighlighterPopover
          config={tools.highlighter}
          onChange={onUpdateHighlighter}
          onClose={onClosePopover}
        />
      )}

      {tools.activePopover === 'eraser' && (
        <EraserPopover
          config={tools.eraser}
          onChange={onUpdateEraser}
          onClearCanvas={onClearCanvas}
          onClose={onClosePopover}
        />
      )}

      {tools.activePopover === 'shapes' && (
        <ShapesPopover
          config={tools.shapes}
          onChange={onUpdateShapes}
          onClose={onClosePopover}
        />
      )}
    </aside>
  );
};
