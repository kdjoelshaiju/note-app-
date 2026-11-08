import React, { useState } from 'react';
import { NotebookDocument, Folder, TemplateType, PaperColor } from '../../types/document';
import { NoteCard } from './NoteCard';
import {
  Menu,
  Plus,
  Search,
  MoreVertical,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  BookOpen,
  LayoutGrid,
  List as ListIcon,
  Upload,
  ArrowUpDown,
  X,
  File,
  RotateCcw
} from 'lucide-react';

interface LibraryViewProps {
  documents: NotebookDocument[];
  folders: Folder[];
  currentDocId: string;
  onSelectDocument: (doc: NotebookDocument) => void;
  onCreateNotebook: (title?: string, templateType?: TemplateType, paperColor?: PaperColor, folderId?: string) => void;
  onDuplicateNotebook: (id: string) => void;
  onSoftDeleteNotebook: (id: string) => void;
  onRestoreNotebook: (id: string) => void;
  onDeleteNotebookPermanent: (id: string) => void;
  onEmptyRecycleBin: () => void;
  onMoveToFolder: (id: string, folderId: string | undefined) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
}

interface FolderTreeItemProps {
  folder: Folder;
  allFolders: Folder[];
  activeDocs: NotebookDocument[];
  activeCategory: string;
  depth?: number;
  onSelectCategory: (catId: string) => void;
  onSelectDocument: (doc: NotebookDocument) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
}

// Recursive Nested Folder Tree Item (Supports Infinite Nested Subfolders & Notes)
const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  folder,
  allFolders,
  activeDocs,
  activeCategory,
  depth = 0,
  onSelectCategory,
  onSelectDocument,
  onCreateFolder
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subName, setSubName] = useState('');

  // Child folders and child notes
  const childFolders = allFolders.filter((f) => f.parentId === folder.id);
  const folderNotes = activeDocs.filter((d) => d.folderId === folder.id);
  const isCur = activeCategory === folder.id;
  const hasChildren = childFolders.length > 0 || folderNotes.length > 0;

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subName.trim()) {
      onCreateFolder(subName.trim(), folder.id);
      setSubName('');
      setIsAddingSub(false);
      setIsOpen(true);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`group flex items-center justify-between rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer ${
          isCur ? 'bg-[#292725] text-[#f5f4f0] font-semibold' : 'text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelectCategory(folder.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-0.5 rounded text-[#78716c] hover:text-[#f5f4f0]"
          >
            {hasChildren ? (
              isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />
            ) : (
              <span className="w-3" />
            )}
          </button>
          {isCur ? (
            <FolderOpen size={15} className="text-[#f5f4f0] shrink-0" />
          ) : (
            <FolderIcon size={15} className="text-[#78716c] shrink-0" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="font-editorial-mono text-[10px] text-[#78716c]">
            {folderNotes.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingSub(!isAddingSub);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-[#8a867f] hover:text-[#f5f4f0] transition-opacity"
            title="Add subfolder"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Inline Subfolder creation form */}
      {isAddingSub && (
        <form
          onSubmit={handleSubSubmit}
          className="my-1 pr-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
        >
          <input
            type="text"
            placeholder="Subfolder name..."
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onBlur={() => setIsAddingSub(false)}
            autoFocus
            className="w-full rounded border border-[#57534e] bg-[#242321] px-2 py-0.5 font-editorial-body text-[11px] text-[#f5f4f0] outline-none"
          />
        </form>
      )}

      {/* Render Nested Subfolders and Nested Notes when open */}
      {isOpen && (
        <div className="space-y-0.5">
          {/* Subfolders */}
          {childFolders.map((childF) => (
            <FolderTreeItem
              key={childF.id}
              folder={childF}
              allFolders={allFolders}
              activeDocs={activeDocs}
              activeCategory={activeCategory}
              depth={depth + 1}
              onSelectCategory={onSelectCategory}
              onSelectDocument={onSelectDocument}
              onCreateFolder={onCreateFolder}
            />
          ))}

          {/* Notes inside this folder directly shown in dropdown tree */}
          {folderNotes.map((note) => (
            <div
              key={note.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDocument(note);
              }}
              className="group flex items-center justify-between rounded-lg px-2 py-1 text-[11px] text-[#8a867f] hover:bg-[#1f1e1c] hover:text-[#f5f4f0] cursor-pointer transition-colors"
              style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
            >
              <div className="flex items-center gap-2 truncate">
                <File size={13} className="text-[#57534e] shrink-0" />
                <span className="truncate">{note.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  folders,
  currentDocId,
  onSelectDocument,
  onCreateNotebook,
  onDuplicateNotebook,
  onSoftDeleteNotebook,
  onRestoreNotebook,
  onDeleteNotebookPermanent,
  onEmptyRecycleBin,
  onMoveToFolder,
  onCreateFolder,
  onDeleteFolder: _onDeleteFolder
}) => {
  // Sidebar expansion & folder section state
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);

  // Active category filter: 'all' | 'recycle-bin' | folderId
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Top bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title'>('updatedAt');

  // Popovers & Dialogs
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [targetMoveDocId, setTargetMoveDocId] = useState<string | null>(null);

  const isRecycleBinPage = activeCategory === 'recycle-bin';

  // Calculate document statistics
  const activeDocs = documents.filter((d) => !d.isDeleted);
  const deletedDocs = documents.filter((d) => d.isDeleted);

  // Top-level folders (parentId is null/undefined)
  const rootFolders = folders.filter((f) => !f.parentId);

  // Filtered documents based on active page category
  const displayedDocs = documents
    .filter((d) => {
      if (isRecycleBinPage) {
        return d.isDeleted;
      }
      if (d.isDeleted) return false;

      if (activeCategory === 'all') return true;
      return d.folderId === activeCategory;
    })
    .filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.content.textHtml && d.content.textHtml.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return b.updatedAt - a.updatedAt;
    });

  // Dynamic Header Title
  const activeCategoryTitle = React.useMemo(() => {
    if (activeCategory === 'all') return 'All notes';
    if (isRecycleBinPage) return 'Recycle bin';
    const found = folders.find((f) => f.id === activeCategory);
    return found ? found.name : 'Folder Notes';
  }, [activeCategory, folders, isRecycleBinPage]);

  // Fast Note Creation ("Hop Straight In" - zero modal setup!)
  const handleFastCreate = () => {
    if (isRecycleBinPage) return; // Prevent creation in recycle bin
    const currentFolder = activeCategory !== 'all' ? activeCategory : undefined;
    onCreateNotebook('', 'lined', '#fbfbf8', currentFolder);
  };

  // Import file handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const currentFolder = activeCategory !== 'all' && !isRecycleBinPage ? activeCategory : undefined;
      onCreateNotebook(fileName, 'lined', '#fbfbf8', currentFolder);
    };
    reader.readAsText(file);
  };

  const handleCreateRootFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121110] text-[#e8e6e3] select-none">
      {/* 2. Collapsible Side Navigation Drawer (Minimalist Monochrome) */}
      <aside
        className={`flex h-full flex-col border-r border-[#242321] bg-[#161514] transition-all duration-200 z-30 ${
          isDrawerExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Drawer Header Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#242321]">
          {isDrawerExpanded ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#292725] text-[#f5f4f0] border border-[#3d3b38] shadow-sm">
                <BookOpen size={16} strokeWidth={2.2} />
              </div>
              <span className="font-editorial-heading text-base font-bold tracking-wider text-[#f5f4f0]">
                ONE BOOK
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-[#292725] text-[#f5f4f0] border border-[#3d3b38]">
              <BookOpen size={16} strokeWidth={2.2} />
            </div>
          )}
        </div>

        {/* Drawer Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {/* 1. All Notes */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#292725] text-[#f5f4f0] shadow-sm'
                : 'text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
            }`}
            title="All notes"
          >
            <div className="flex items-center gap-3">
              <FileText size={17} className={activeCategory === 'all' ? 'text-[#f5f4f0]' : 'text-[#8a867f]'} />
              {isDrawerExpanded && <span>All notes</span>}
            </div>
            {isDrawerExpanded && (
              <span className="font-editorial-mono text-[11px] rounded-full bg-[#201f1d] px-2 py-0.5 text-[#8a867f]">
                {activeDocs.length}
              </span>
            )}
          </button>

          {/* 2. Folders Tab with Dropdown & Infinite Nested Folders/Notes */}
          <div>
            <div
              onClick={() => setIsFoldersOpen(!isFoldersOpen)}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#e5e2dc] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderIcon size={17} className="text-[#8a867f]" />
                {isDrawerExpanded && <span>Folders</span>}
              </div>
              {isDrawerExpanded && (
                <div className="flex items-center gap-1.5">
                  <span className="font-editorial-mono text-[11px] rounded-full bg-[#201f1d] px-2 py-0.5 text-[#8a867f]">
                    {folders.length}
                  </span>
                  {isFoldersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </div>

            {/* Nested Folders & Notes Dropdown Tree */}
            {isDrawerExpanded && isFoldersOpen && (
              <div className="my-1 space-y-0.5">
                {rootFolders.map((rf) => (
                  <FolderTreeItem
                    key={rf.id}
                    folder={rf}
                    allFolders={folders}
                    activeDocs={activeDocs}
                    activeCategory={activeCategory}
                    onSelectCategory={(id) => setActiveCategory(id)}
                    onSelectDocument={onSelectDocument}
                    onCreateFolder={onCreateFolder}
                  />
                ))}

                {/* Inline Add Root Folder Form */}
                {isAddingFolder ? (
                  <form onSubmit={handleCreateRootFolderSubmit} className="my-1 px-2">
                    <input
                      type="text"
                      placeholder="New folder..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => setIsAddingFolder(false)}
                      autoFocus
                      className="w-full rounded border border-[#57534e] bg-[#242321] px-2 py-1 font-editorial-body text-xs text-[#f5f4f0] outline-none"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingFolder(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#8a867f] hover:text-[#f5f4f0] transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add root folder</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Dedicated Recycle Bin Page Link */}
          <button
            onClick={() => setActiveCategory('recycle-bin')}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
              isRecycleBinPage
                ? 'bg-[#292725] text-[#f5f4f0] shadow-sm'
                : 'text-[#a8a49d] hover:bg-[#1f1e1c] hover:text-[#e5e2dc]'
            }`}
            title="Recycle bin"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={17} className={isRecycleBinPage ? 'text-[#f5f4f0]' : 'text-[#8a867f]'} />
              {isDrawerExpanded && <span>Recycle bin</span>}
            </div>
            {isDrawerExpanded && (
              <span className="font-editorial-mono text-[11px] rounded-full bg-[#201f1d] px-2 py-0.5 text-[#8a867f]">
                {deletedDocs.length}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Workspace Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Streamlined Top Action Bar */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#242321] bg-[#161514] px-6">
          {/* Top Left: Hamburger Menu `≡` & Page Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#a8a49d] transition-colors hover:bg-[#22211f] hover:text-[#f5f4f0]"
              title="Toggle sidebar drawer"
              aria-label="Toggle drawer"
            >
              <Menu size={19} />
            </button>

            <h1 className="font-editorial-heading text-lg font-bold text-[#f5f4f0] tracking-wide">
              {activeCategoryTitle}
            </h1>
          </div>

          {/* Top Right Actions Group */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-56 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716c]" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#2d2b28] bg-[#1d1c1a] py-1.5 pl-9 pr-3 font-editorial-body text-xs text-[#e8e6e3] placeholder-[#78716c] outline-none transition-colors focus:border-[#78716c]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#e8e6e3]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Import File Button (Disabled in Recycle Bin) */}
            {!isRecycleBinPage && (
              <label
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#2d2b28] bg-[#1d1c1a] text-[#a8a49d] transition-colors hover:bg-[#272523] hover:text-[#f5f4f0]"
                title="Import file as new note"
              >
                <Upload size={16} />
                <input type="file" accept=".txt,.json,.md,.doc" onChange={handleImportFile} className="hidden" />
              </label>
            )}

            {/* View Layout Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2d2b28] bg-[#1d1c1a] text-[#a8a49d] transition-colors hover:bg-[#272523] hover:text-[#f5f4f0]"
              title={viewMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
            >
              {viewMode === 'grid' ? <ListIcon size={16} /> : <LayoutGrid size={16} />}
            </button>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'updatedAt' ? 'title' : 'updatedAt')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2d2b28] bg-[#1d1c1a] text-[#a8a49d] transition-colors hover:bg-[#272523] hover:text-[#f5f4f0]"
              title={`Sort by ${sortBy === 'updatedAt' ? 'Title' : 'Date modified'}`}
            >
              <ArrowUpDown size={15} />
            </button>

            {/* 3-Dots Action Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowTopMenu(!showTopMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2d2b28] bg-[#1d1c1a] text-[#a8a49d] transition-colors hover:bg-[#272523] hover:text-[#f5f4f0]"
                title="More actions"
              >
                <MoreVertical size={16} />
              </button>

              {showTopMenu && (
                <div
                  className="absolute right-0 top-11 z-40 w-44 rounded-xl border border-[#383633] bg-[#21201e] p-1 shadow-2xl backdrop-blur-md"
                  onClick={() => setShowTopMenu(false)}
                >
                  <button
                    onClick={() => setIsAddingFolder(true)}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs text-[#d6d3cd] hover:bg-[#2c2a27]"
                  >
                    <FolderIcon size={14} />
                    <span>Create folder</span>
                  </button>
                  {isRecycleBinPage && (
                    <button
                      onClick={onEmptyRecycleBin}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs text-[#f5f4f0] hover:bg-[#2c2a27]"
                    >
                      <Trash2 size={14} />
                      <span>Empty recycle bin</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Top Right "+ New Note" Button (REMOVED / HIDDEN WHEN IN RECYCLE BIN) */}
            {!isRecycleBinPage && (
              <button
                onClick={handleFastCreate}
                className="flex items-center gap-1.5 rounded-xl bg-[#e5e2dc] px-3.5 py-2 font-editorial-heading text-xs font-semibold text-[#1a1918] shadow-md transition-all hover:bg-[#ffffff] active:scale-95"
              >
                <Plus size={15} strokeWidth={2.2} />
                <span>New note</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Grid / Page Content */}
        <main className="relative flex-1 overflow-y-auto p-6">
          {/* Recycle Bin Specific Banner */}
          {isRecycleBinPage && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-[#2d2b28] bg-[#181716] p-4 text-xs text-[#a8a49d]">
              <div>
                <p className="font-editorial-heading text-sm font-semibold text-[#f5f4f0]">
                  Recycle bin ({deletedDocs.length} items)
                </p>
                <p className="font-editorial-mono text-[11px] text-[#78716c] mt-0.5">
                  Items in the recycle bin remain stored until permanently emptied or restored.
                </p>
              </div>
              {deletedDocs.length > 0 && (
                <button
                  onClick={onEmptyRecycleBin}
                  className="flex items-center gap-1.5 rounded-lg border border-[#383633] bg-[#242321] px-3 py-1.5 font-editorial-heading text-xs font-semibold text-[#f5f4f0] hover:bg-[#2e2c2a]"
                >
                  <Trash2 size={13} />
                  <span>Empty bin</span>
                </button>
              )}
            </div>
          )}

          {displayedDocs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-20">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2d2b28] bg-[#1c1b1a] text-[#78716c]">
                <FileText size={26} />
              </div>
              <h2 className="font-editorial-heading text-base font-medium text-[#d6d3cd]">
                No notes in {activeCategoryTitle}
              </h2>
              <p className="font-editorial-mono text-xs text-[#78716c] mt-1 max-w-sm">
                {isRecycleBinPage
                  ? 'Your recycle bin is completely empty.'
                  : 'Tap "+ New note" to hop straight into your workspace.'}
              </p>
              {!isRecycleBinPage && (
                <button
                  onClick={handleFastCreate}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-[#e5e2dc] px-4 py-2 text-xs font-semibold text-[#1a1918] hover:bg-[#ffffff]"
                >
                  <Plus size={15} />
                  <span>Create note</span>
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                  : 'flex flex-col gap-2.5 max-w-4xl mx-auto'
              }
            >
              {displayedDocs.map((doc) => (
                <NoteCard
                  key={doc.id}
                  doc={doc}
                  isCurrent={doc.id === currentDocId}
                  viewMode={viewMode}
                  isRecycleBin={isRecycleBinPage}
                  onSelect={onSelectDocument}
                  onDuplicate={onDuplicateNotebook}
                  onSoftDelete={onSoftDeleteNotebook}
                  onRestore={onRestoreNotebook}
                  onDeletePermanent={onDeleteNotebookPermanent}
                  onMoveToFolder={(id) => setTargetMoveDocId(id)}
                />
              ))}
            </div>
          )}

          {/* Fast Note Creation Floating Action Button (FAB) (REMOVED / HIDDEN IN RECYCLE BIN) */}
          {!isRecycleBinPage && (
            <button
              onClick={handleFastCreate}
              className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#e5e2dc] text-[#1a1918] shadow-2xl transition-all hover:bg-[#ffffff] hover:scale-105 active:scale-95"
              title="Create new note"
              aria-label="New Note"
            >
              <Plus size={24} strokeWidth={2.4} />
            </button>
          )}
        </main>
      </div>

      {/* Move to Folder Dialog */}
      {targetMoveDocId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setTargetMoveDocId(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-[#383633] bg-[#1e1d1b] p-5 text-[#e8e6e3] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 font-editorial-heading text-base font-bold text-[#f5f4f0]">
              Move to folder
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onMoveToFolder(targetMoveDocId, undefined);
                  setTargetMoveDocId(null);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs hover:bg-[#292725] text-[#d6d3cd]"
              >
                <span>No folder (Uncategorized)</span>
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveToFolder(targetMoveDocId, f.id);
                    setTargetMoveDocId(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs hover:bg-[#292725] text-[#d6d3cd]"
                >
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTargetMoveDocId(null)}
                className="rounded-xl px-3 py-1.5 text-xs text-[#8a867f] hover:bg-[#2c2a27]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
