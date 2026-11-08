import React from 'react';
import { NotebookDocument } from '../../types/document';
import { PageEngine } from '../../pages/PageEngine';
import { X, Plus, Trash2 } from 'lucide-react';

interface PageOverviewDrawerProps {
  isOpen: boolean;
  document: NotebookDocument;
  onClose: () => void;
  onJumpToPage: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: (pageIndex: number) => void;
}

export const PageOverviewDrawer: React.FC<PageOverviewDrawerProps> = ({
  isOpen,
  document: doc,
  onClose,
  onJumpToPage,
  onAddPage,
  onDeletePage
}) => {
  if (!isOpen) return null;

  const pages = PageEngine.getAllPageBounds(doc.content.pageCount, {
    mode: doc.settings.mode,
    scrollDirection: doc.settings.scrollDirection,
    orientation: doc.settings.page.orientation
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-80 flex-col border-l border-[#33312e] bg-[#1a1918] p-5 text-[#e8e6e3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[#2d2b28] pb-3">
          <div>
            <h3 className="font-editorial-heading text-lg font-medium tracking-wide text-[#f5f4f0]">
              Page Overview
            </h3>
            <span className="font-editorial-mono text-[11px] text-[#8f8b85]">
              {doc.content.pageCount} {doc.content.pageCount === 1 ? 'Page' : 'Pages'} total
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Page Thumbnails List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {pages.map((p) => {
            const isLandscape = doc.settings.page.orientation === 'landscape';
            return (
              <div
                key={p.pageIndex}
                className="group relative cursor-pointer rounded-xl border border-[#33312e] bg-[#22211f] p-3 transition-colors hover:border-[#78716c]"
                onClick={() => {
                  onJumpToPage(p.pageIndex);
                  onClose();
                }}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-editorial-mono font-medium text-[#e8e6e3]">
                    Page {p.pageIndex + 1}
                  </span>
                  {doc.content.pageCount > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(p.pageIndex);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[#8f8b85] transition-colors hover:bg-[#2d2b28] hover:text-[#f43f5e]"
                      title="Delete Page"
                      aria-label={`Delete Page ${p.pageIndex + 1}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Visual miniature representation */}
                <div
                  className="mx-auto rounded border border-[#44403c] shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: doc.settings.page.backgroundColor,
                    width: isLandscape ? '140px' : '100px',
                    height: isLandscape ? '100px' : '140px'
                  }}
                >
                  <span
                    className="font-editorial-heading text-2xl font-light opacity-30 select-none"
                    style={{
                      color:
                        doc.settings.page.backgroundColor === '#141312' ||
                        doc.settings.page.backgroundColor === '#292827'
                          ? '#ffffff'
                          : '#000000'
                    }}
                  >
                    {p.pageIndex + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Page Button */}
        <div className="mt-4 border-t border-[#2d2b28] pt-3">
          <button
            onClick={onAddPage}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#44403c] bg-[#262422] py-2.5 text-xs font-medium text-[#f5f4f0] transition-colors hover:bg-[#33312e]"
          >
            <Plus size={15} />
            <span>Add New Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
