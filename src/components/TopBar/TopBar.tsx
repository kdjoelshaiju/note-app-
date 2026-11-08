import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Plus,
  ImagePlus,
  FilePlus,
  Layers,
  Settings2,
  FileDown,
  LayoutGrid,
  Scroll,
  Maximize,
  Minimize2,
  Maximize2,
  Trash2,
  HelpCircle,
  Check
} from 'lucide-react';
import { NotebookDocument, DocumentMode } from '../../types/document';

interface TopBarProps {
  document: NotebookDocument;
  onBackToLibrary: () => void;
  onUpdateTitle: (title: string) => void;
  onOpenPageOverview: () => void;
  onOpenPageSettings: () => void;
  onOpenExportDialog: () => void;
  onOpenAboutDialog: () => void;
  onInsertImage: (file: File) => void;
  onAddPage: () => void;
  onModeChange: (mode: DocumentMode) => void;
  onFitToView: () => void;
  onClearCanvas: () => void;
  onDeleteDocument?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  document,
  onBackToLibrary,
  onUpdateTitle,
  onOpenPageOverview,
  onOpenPageSettings,
  onOpenExportDialog,
  onOpenAboutDialog,
  onInsertImage,
  onAddPage,
  onModeChange,
  onFitToView,
  onClearCanvas,
  onDeleteDocument
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(document.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitleValue(document.title);
  }, [document.title]);

  // Click-away listener for 3-dots menu and plus menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setPlusMenuOpen(false);
      }
    };

    if (menuOpen || plusMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen, plusMenuOpen]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onUpdateTitle(titleValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(document.title);
      setIsEditingTitle(false);
    }
  };

  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInsertImage(file);
      e.target.value = '';
    }
  };

  return (
    <header className="relative z-30 flex h-12 w-full items-center justify-between border-b border-[#222120] bg-[#141312] px-3.5 text-[#d6d3cd] select-none transition-colors">
      {/* Hidden file input for image insertion */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Minimal Back Icon + Document Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          onClick={onBackToLibrary}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9e9a93] transition-colors hover:bg-[#201f1d] hover:text-[#f2efe9]"
          title="Back to library"
          aria-label="Back to library"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="rounded border border-[#57534e] bg-[#1f1e1c] px-2 py-0.5 font-editorial-heading text-base font-medium text-[#f5f4f0] outline-none"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-1.5 rounded px-2 py-1 text-left transition-colors hover:bg-[#201f1d]"
            title="Click to rename"
          >
            <span className="font-editorial-heading text-base font-medium tracking-wide text-[#f2efe9] group-hover:text-white truncate max-w-[260px] sm:max-w-md">
              {document.title}
            </span>
          </button>
        )}
      </div>

      {/* Center: Clean & uncluttered (no text toggle buttons) */}
      <div className="flex-1" />

      {/* Right: Minimalist action icons (View toggle, Plus, 3-dots) */}
      <div className="flex items-center gap-1">
        {/* 1. View / Fit-to-View Toggle */}
        <button
          onClick={onFitToView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9e9a93] transition-colors hover:bg-[#201f1d] hover:text-[#f2efe9]"
          title="Fit to view"
          aria-label="Fit to view"
        >
          <Minimize2 size={17} strokeWidth={1.8} />
        </button>

        {/* 2. Plus (Insert / Add Page) Menu */}
        <div className="relative" ref={plusMenuRef}>
          <button
            onClick={() => {
              setPlusMenuOpen(!plusMenuOpen);
              setMenuOpen(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              plusMenuOpen
                ? 'bg-[#252422] text-[#f2efe9]'
                : 'text-[#9e9a93] hover:bg-[#201f1d] hover:text-[#f2efe9]'
            }`}
            title="Insert content or page"
            aria-label="Insert"
          >
            <Plus size={18} strokeWidth={2} />
          </button>

          {plusMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-[#2d2b28] bg-[#1a1918] p-1 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => {
                  setPlusMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#d6d3cd] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
              >
                <ImagePlus size={15} className="text-[#9e9a93]" />
                <span>Insert Image</span>
              </button>

              <button
                onClick={() => {
                  setPlusMenuOpen(false);
                  onAddPage();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#d6d3cd] transition-colors hover:bg-[#252422] hover:text-[#f5f4f0]"
              >
                <FilePlus size={15} className="text-[#9e9a93]" />
                <span>Add Page</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Three-Dots (More Options) Master Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setPlusMenuOpen(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              menuOpen
                ? 'bg-[#252422] text-[#f2efe9]'
                : 'text-[#9e9a93] hover:bg-[#201f1d] hover:text-[#f2efe9]'
            }`}
            title="More options"
            aria-label="More options"
          >
            <MoreVertical size={18} strokeWidth={2} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-[#2d2b28] bg-[#1a1918] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              {/* Section 1: View Format with Icons */}
              <div className="px-2.5 py-1 text-[10px] font-editorial-mono font-medium uppercase tracking-wider text-[#736f69]">
                View Format
              </div>

              <button
                onClick={() => {
                  onModeChange('split-pages');
                  setMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  document.settings.mode === 'split-pages'
                    ? 'bg-[#252422] font-medium text-[#f5f4f0]'
                    : 'text-[#c7c4be] hover:bg-[#201f1d] hover:text-[#f5f4f0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid size={15} className="text-[#9e9a93]" />
                  <span>Split Pages</span>
                </div>
                {document.settings.mode === 'split-pages' && (
                  <Check size={14} className="text-[#a8a49d]" />
                )}
              </button>

              <button
                onClick={() => {
                  onModeChange('infinite-scroll');
                  setMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  document.settings.mode === 'infinite-scroll'
                    ? 'bg-[#252422] font-medium text-[#f5f4f0]'
                    : 'text-[#c7c4be] hover:bg-[#201f1d] hover:text-[#f5f4f0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scroll size={15} className="text-[#9e9a93]" />
                  <span>Infinite Scroll</span>
                </div>
                {document.settings.mode === 'infinite-scroll' && (
                  <Check size={14} className="text-[#a8a49d]" />
                )}
              </button>

              <button
                onClick={() => {
                  onModeChange('infinite-canvas');
                  setMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  document.settings.mode === 'infinite-canvas'
                    ? 'bg-[#252422] font-medium text-[#f5f4f0]'
                    : 'text-[#c7c4be] hover:bg-[#201f1d] hover:text-[#f5f4f0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Maximize size={15} className="text-[#9e9a93]" />
                  <span>Infinite Canvas</span>
                </div>
                {document.settings.mode === 'infinite-canvas' && (
                  <Check size={14} className="text-[#a8a49d]" />
                )}
              </button>

              <div className="my-1.5 h-[1px] bg-[#252422]" />

              {/* Section 2: Document Configuration */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPageSettings();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#c7c4be] transition-colors hover:bg-[#201f1d] hover:text-[#f5f4f0]"
              >
                <Settings2 size={15} className="text-[#9e9a93]" />
                <span>Page & Template Settings</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPageOverview();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#c7c4be] transition-colors hover:bg-[#201f1d] hover:text-[#f5f4f0]"
              >
                <Layers size={15} className="text-[#9e9a93]" />
                <span>Page Overview</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  toggleFullscreen();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#c7c4be] transition-colors hover:bg-[#201f1d] hover:text-[#f5f4f0]"
              >
                {isFullscreen ? (
                  <Minimize2 size={15} className="text-[#9e9a93]" />
                ) : (
                  <Maximize2 size={15} className="text-[#9e9a93]" />
                )}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenExportDialog();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#c7c4be] transition-colors hover:bg-[#201f1d] hover:text-[#f5f4f0]"
              >
                <FileDown size={15} className="text-[#9e9a93]" />
                <span>Export PDF / Image</span>
              </button>

              <div className="my-1.5 h-[1px] bg-[#252422]" />

              {/* Section 3: Note Actions */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onClearCanvas();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#d6d3cd] transition-colors hover:bg-[#201f1d]"
              >
                <Trash2 size={15} className="text-[#a8a29e]" />
                <span>Clear Canvas Ink</span>
              </button>

              {onDeleteDocument && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteDocument();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#f43f5e] transition-colors hover:bg-[#201f1d]"
                >
                  <Trash2 size={15} />
                  <span>Delete Notebook</span>
                </button>
              )}

              <div className="my-1.5 h-[1px] bg-[#252422]" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAboutDialog();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#8f8b85] transition-colors hover:bg-[#201f1d] hover:text-[#e8e5df]"
              >
                <HelpCircle size={15} />
                <span>About One Book</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
