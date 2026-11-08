import React, { useRef, useEffect } from 'react';
import { PaperColor } from '../types/document';

interface RichTextDocumentProps {
  html: string;
  onChange: (html: string) => void;
  width: number;
  minHeight: number;
  backgroundColor: PaperColor;
  isEditable: boolean;
  onHeightChange?: (height: number) => void;
}

export const RichTextDocument: React.FC<RichTextDocumentProps> = ({
  html,
  onChange,
  width,
  minHeight,
  backgroundColor,
  isEditable,
  onHeightChange
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isInternalChangeRef = useRef(false);

  // Sync incoming HTML without resetting cursor during typing
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
    isInternalChangeRef.current = false;
  }, [html]);


  const handleInput = () => {
    if (!editorRef.current) return;
    isInternalChangeRef.current = true;
    const newHtml = editorRef.current.innerHTML;
    onChange(newHtml);

    if (onHeightChange) {
      onHeightChange(editorRef.current.scrollHeight);
    }
  };

  // Text color based on paper darkness
  const isDarkPaper = backgroundColor === '#292827' || backgroundColor === '#141312';
  const textColor = isDarkPaper ? '#f5f4f0' : '#1c1917';

  return (
    <div
      ref={editorRef}
      contentEditable={isEditable}
      suppressContentEditableWarning
      onInput={handleInput}
      style={{
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        color: textColor,
        outline: 'none',
        wordBreak: 'break-word',
        lineHeight: '1.75'
      }}
      className={`relative z-10 px-12 py-12 font-editorial-body text-base transition-opacity ${
        isEditable ? 'cursor-text select-text' : 'pointer-events-none'
      } [&_h1]:font-editorial-heading [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:tracking-wide [&_h2]:font-editorial-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-editorial-heading [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[#78716c] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3`}
    />
  );
};
