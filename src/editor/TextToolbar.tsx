import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Highlighter,
  Palette
} from 'lucide-react';

interface TextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  activeFormats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    align: string;
    fontFamily: string;
    fontSize: string;
  };
}

const FONTS = [
  { name: 'Lora', value: "'Lora', Georgia, serif" },
  { name: 'Cormorant Garamond', value: "'Cormorant Garamond', Georgia, serif" },
  { name: 'Libre Baskerville', value: "'Libre Baskerville', Georgia, serif" },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: "'Times New Roman', serif" },
  { name: 'Courier New', value: "'Courier New', monospace" },
  { name: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
  { name: 'Arial', value: 'Arial, sans-serif' }
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export const TextToolbar: React.FC<TextToolbarProps> = ({ onFormat }) => {
  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-[#2d2b28] bg-[#1d1c1a] px-3 py-1 text-xs text-[#d6d3cd]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font Family */}
      <select
        onChange={(e) => onFormat('fontName', e.target.value)}
        className="rounded border border-[#383633] bg-[#242321] px-2 py-1 font-editorial-body text-xs text-[#e5e2dc] outline-none"
        defaultValue="'Lora', Georgia, serif"
      >
        {FONTS.map((f) => (
          <option key={f.name} value={f.value}>
            {f.name}
          </option>
        ))}
      </select>

      {/* Font Size */}
      <select
        onChange={(e) => onFormat('fontSize', e.target.value)}
        className="rounded border border-[#383633] bg-[#242321] px-2 py-1 font-editorial-mono text-xs text-[#e5e2dc] outline-none"
        defaultValue="16px"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="h-4 w-[1px] bg-[#33312e] mx-1" />

      {/* Basic Formatting */}
      <button
        onClick={() => onFormat('bold')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Bold (Ctrl+B)"
      >
        <Bold size={13} />
      </button>

      <button
        onClick={() => onFormat('italic')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Italic (Ctrl+I)"
      >
        <Italic size={13} />
      </button>

      <button
        onClick={() => onFormat('underline')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Underline (Ctrl+U)"
      >
        <Underline size={13} />
      </button>

      <button
        onClick={() => onFormat('strikeThrough')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Strikethrough"
      >
        <Strikethrough size={13} />
      </button>

      <div className="h-4 w-[1px] bg-[#33312e] mx-1" />

      {/* Headings */}
      <button
        onClick={() => onFormat('formatBlock', '<h1>')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Heading 1"
      >
        <Heading1 size={13} />
      </button>

      <button
        onClick={() => onFormat('formatBlock', '<h2>')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Heading 2"
      >
        <Heading2 size={13} />
      </button>

      <button
        onClick={() => onFormat('formatBlock', '<h3>')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Heading 3"
      >
        <Heading3 size={13} />
      </button>

      <button
        onClick={() => onFormat('formatBlock', '<p>')}
        className="flex h-7 px-2 items-center justify-center rounded hover:bg-[#2c2a27] font-editorial-mono text-[11px]"
        title="Paragraph Normal"
      >
        Normal
      </button>

      <div className="h-4 w-[1px] bg-[#33312e] mx-1" />

      {/* Lists */}
      <button
        onClick={() => onFormat('insertUnorderedList')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Bulleted List"
      >
        <List size={13} />
      </button>

      <button
        onClick={() => onFormat('insertOrderedList')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Numbered List"
      >
        <ListOrdered size={13} />
      </button>

      <button
        onClick={() => onFormat('formatBlock', '<blockquote>')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Blockquote"
      >
        <Quote size={13} />
      </button>

      <div className="h-4 w-[1px] bg-[#33312e] mx-1" />

      {/* Alignments */}
      <button
        onClick={() => onFormat('justifyLeft')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Align Left"
      >
        <AlignLeft size={13} />
      </button>

      <button
        onClick={() => onFormat('justifyCenter')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Align Center"
      >
        <AlignCenter size={13} />
      </button>

      <button
        onClick={() => onFormat('justifyRight')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Align Right"
      >
        <AlignRight size={13} />
      </button>

      <button
        onClick={() => onFormat('justifyFull')}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#2c2a27]"
        title="Justify"
      >
        <AlignJustify size={13} />
      </button>

      <div className="h-4 w-[1px] bg-[#33312e] mx-1" />

      {/* Color & Highlight */}
      <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-[#2c2a27]" title="Text Color">
        <Palette size={13} />
        <input
          type="color"
          defaultValue="#1c1917"
          onChange={(e) => onFormat('foreColor', e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-[#2c2a27]" title="Highlight Text">
        <Highlighter size={13} />
        <input
          type="color"
          defaultValue="#d6d3d1"
          onChange={(e) => onFormat('hiliteColor', e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
};
