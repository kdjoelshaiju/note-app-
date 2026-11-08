import React from 'react';
import { NotebookDocument } from '../../types/document';
import { MoreVertical, FolderInput, RotateCcw, Trash2, Copy, Edit3 } from 'lucide-react';

interface NoteCardProps {
  doc: NotebookDocument;
  isCurrent: boolean;
  viewMode: 'grid' | 'list';
  isRecycleBin?: boolean;
  onSelect: (doc: NotebookDocument) => void;
  onDuplicate: (id: string) => void;
  onSoftDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onDeletePermanent: (id: string) => void;
  onMoveToFolder?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  doc,
  isCurrent,
  viewMode,
  isRecycleBin = false,
  onSelect,
  onDuplicate,
  onSoftDelete,
  onRestore,
  onDeletePermanent,
  onMoveToFolder,
  onRename
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(doc.title);

  const formattedDate = React.useMemo(() => {
    const d = new Date(doc.updatedAt);
    const day = d.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[d.getMonth()]}`;
  }, [doc.updatedAt]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRename && titleInput.trim()) {
      onRename(doc.id, titleInput.trim());
    }
    setIsRenaming(false);
  };

  // Content preview snippet derived from textHtml
  const textSnippet = React.useMemo(() => {
    if (!doc.content.textHtml) return '';
    const temp = document.createElement('div');
    temp.innerHTML = doc.content.textHtml;
    return temp.textContent || temp.innerText || '';
  }, [doc.content.textHtml]);

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(doc)}
        className={`group relative flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
          isCurrent
            ? 'border-[#78716c] bg-[#22201e]'
            : 'border-[#292725] bg-[#1a1918] hover:border-[#44403c] hover:bg-[#201f1d]'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Mini paper thumbnail icon */}
          <div
            className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md border border-[#33312e] shadow-sm relative overflow-hidden"
            style={{ backgroundColor: doc.settings.page.backgroundColor }}
          >
            {/* Lined rule preview lines */}
            <div className="absolute inset-0 flex flex-col justify-around py-1 opacity-20 pointer-events-none">
              <div className="h-[1px] w-full bg-current" />
              <div className="h-[1px] w-full bg-current" />
              <div className="h-[1px] w-full bg-current" />
            </div>
            {doc.content.strokes.length > 0 && (
              <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 100 120">
                {doc.content.strokes.slice(0, 3).map((s, i) => (
                  <polyline
                    key={i}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.width * 2}
                    points={s.points.map((p) => `${p.x / 5},${p.y / 5}`).join(' ')}
                  />
                ))}
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleRenameSubmit}
                  autoFocus
                  className="w-full rounded border border-[#57534e] bg-[#292827] px-2 py-0.5 text-xs text-[#f5f4f0] outline-none"
                />
              </form>
            ) : (
              <h3 className="font-editorial-heading text-sm font-semibold text-[#f5f4f0] truncate">
                {doc.title}
              </h3>
            )}
            <p className="font-editorial-mono text-[11px] text-[#8a867f] truncate mt-0.5">
              {textSnippet || 'No additional text'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#78716c] font-editorial-mono ml-4 shrink-0">
          <span>{formattedDate}</span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-lg p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0]"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-7 z-30 w-36 rounded-xl border border-[#383633] bg-[#21201e] p-1 shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {!isRecycleBin ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsRenaming(true);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Edit3 size={13} />
                      <span>Rename</span>
                    </button>
                    {onMoveToFolder && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onMoveToFolder(doc.id);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                      >
                        <FolderInput size={13} />
                        <span>Move folder</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDuplicate(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Copy size={13} />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSoftDelete(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Trash2 size={13} />
                      <span>Recycle bin</span>
                    </button>
                  </>
                ) : (
                  <>
                    {onRestore && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onRestore(doc.id);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeletePermanent(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Trash2 size={13} />
                      <span>Delete forever</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Samsung Notes Dense Grid Card View
  return (
    <div
      onClick={() => onSelect(doc)}
      className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 transition-all cursor-pointer ${
        isCurrent
          ? 'border-[#78716c] bg-[#1d1c1a] shadow-lg ring-1 ring-[#57534e]/50'
          : 'border-[#262422] bg-[#171615] hover:border-[#44403c] hover:bg-[#1f1d1b]'
      }`}
    >
      {/* High-Fidelity Paper Thumbnail Preview */}
      <div
        className="relative mb-3 aspect-[3/4] w-full rounded-xl border border-[#2d2b28] p-3 shadow-inner overflow-hidden flex flex-col justify-between group-hover:border-[#44403c] transition-colors"
        style={{ backgroundColor: doc.settings.page.backgroundColor }}
      >
        {/* Template background visual patterns */}
        {doc.settings.page.template.type === 'lined' && (
          <div className="absolute inset-0 flex flex-col justify-between py-4 px-3 opacity-25 pointer-events-none">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="h-[1px] w-full bg-[#3d3b38]" />
            ))}
          </div>
        )}
        {doc.settings.page.template.type === 'grid' && (
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #3d3b38 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          />
        )}
        {doc.settings.page.template.type === 'oxford' && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-[#f43f5e]/40" />
            <div className="flex flex-col justify-between py-4 px-3 h-full">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-[1px] w-full bg-[#3d3b38]" />
              ))}
            </div>
          </div>
        )}

        {/* Scaled Mini SVG Preview of Vector Strokes */}
        {doc.content.strokes.length > 0 && (
          <svg className="absolute inset-0 h-full w-full p-2 opacity-80" viewBox="0 0 600 800">
            {doc.content.strokes.map((s, idx) => (
              <polyline
                key={idx}
                fill="none"
                stroke={s.color}
                strokeWidth={Math.max(3, s.width * 1.5)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={s.opacity ?? 1}
                points={s.points.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            ))}
          </svg>
        )}

        {/* Text Line Snippet Preview Overlay */}
        <div className="relative z-10 font-editorial-body text-[10px] leading-tight opacity-75 line-clamp-6 text-black/80 dark:text-white/80 pointer-events-none">
          {textSnippet}
        </div>

        {/* Subtle Page Badge */}
        <div className="relative z-10 flex justify-end">
          <span className="font-editorial-mono text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/10 backdrop-blur-sm text-[#78716c]">
            {doc.content.pageCount}P
          </span>
        </div>
      </div>

      {/* Note Title & Date directly underneath card (Samsung Notes standard) */}
      <div className="px-1 pb-1">
        <div className="flex items-center justify-between gap-1">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="flex-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleRenameSubmit}
                autoFocus
                className="w-full rounded border border-[#57534e] bg-[#292827] px-1.5 py-0.5 text-xs text-[#f5f4f0] outline-none"
              />
            </form>
          ) : (
            <h3 className="font-editorial-heading text-sm font-semibold text-[#f5f4f0] truncate flex-1">
              {doc.title}
            </h3>
          )}

          {/* Card Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-lg p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0] transition-colors"
            >
              <MoreVertical size={13} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 bottom-6 z-30 w-36 rounded-xl border border-[#383633] bg-[#21201e] p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                {!isRecycleBin ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsRenaming(true);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Edit3 size={12} />
                      <span>Rename</span>
                    </button>
                    {onMoveToFolder && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onMoveToFolder(doc.id);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                      >
                        <FolderInput size={12} />
                        <span>Move folder</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDuplicate(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Copy size={12} />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onSoftDelete(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Trash2 size={12} />
                      <span>Recycle bin</span>
                    </button>
                  </>
                ) : (
                  <>
                    {onRestore && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onRestore(doc.id);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                      >
                        <RotateCcw size={12} />
                        <span>Restore</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeletePermanent(doc.id);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                    >
                      <Trash2 size={12} />
                      <span>Delete forever</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clean, subtle date string (e.g. "7 Nov") */}
        <p className="font-editorial-mono text-[11px] text-[#78716c] mt-0.5">
          {formattedDate}
        </p>
      </div>
    </div>
  );
};
