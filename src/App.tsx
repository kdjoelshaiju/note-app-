import React, { useState, useEffect, useCallback } from 'react';
import { useDocumentStore } from './store/useDocumentStore';
import { TopBar } from './components/TopBar/TopBar';
import { ToolRail } from './components/ToolRail/ToolRail';
import { CanvasEngine } from './canvas/CanvasEngine';
import { LibraryView } from './components/Library/LibraryView';
import { PageSettingsDialog } from './components/Dialogs/PageSettingsDialog';
import { PageOverviewDrawer } from './components/Dialogs/PageOverviewDrawer';
import { ExportDialog } from './components/Dialogs/ExportDialog';
import { AboutDialog } from './components/Dialogs/AboutDialog';
import { CloudSettingsDialog } from './components/Dialogs/CloudSettingsDialog';
import { PageEngine } from './pages/PageEngine';

export function App() {
  const {
    currentDoc,
    docList,
    tools,
    viewport,
    appMode,
    canUndo,
    canRedo,
    pageSettingsOpen,
    pageOverviewOpen,
    exportDialogOpen,
    aboutDialogOpen,
    setViewport,
    setAppMode,
    setPageSettingsOpen,
    setPageOverviewOpen,
    setExportDialogOpen,
    setAboutDialogOpen,
    setDocument,
    updateTitle,
    updateDocumentSettings,
    updatePageSettings,
    addStroke,
    addShape,
    addImage,
    updateTextHtml,
    setPageCount,
    deletePage,
    eraseStrokeById,
    eraseStrokesByIds,
    eraseArea,
    replaceStrokes,
    clearCanvas,
    setActiveTool,
    togglePopover,
    closePopover,
    updatePenConfig,
    updateHighlighterConfig,
    updateEraserConfig,
    updateShapesConfig,
    setLassoSelection,
    deleteSelection,
    duplicateSelection,
    transformSelection,
    undo,
    redo,
    createNotebook,
    deleteNotebook,
    duplicateNotebook,
    softDeleteNotebook,
    restoreNotebook,
    emptyRecycleBin,
    moveToFolder,
    folders,
    createFolder,
    deleteFolder
  } = useDocumentStore();

  const [customTemplateImage, setCustomTemplateImage] = useState<HTMLImageElement | null>(null);
  const [cloudSettingsOpen, setCloudSettingsOpen] = useState(false);

  // Load custom template image if present in document
  useEffect(() => {
    if (currentDoc.settings.page.template.customImageData) {
      const img = new Image();
      img.src = currentDoc.settings.page.template.customImageData;
      img.onload = () => setCustomTemplateImage(img);
    } else {
      setCustomTemplateImage(null);
    }
  }, [currentDoc.settings.page.template.customImageData]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes popover
      if (e.key === 'Escape') {
        closePopover();
        setPageSettingsOpen(false);
        setPageOverviewOpen(false);
        setExportDialogOpen(false);
        setAboutDialogOpen(false);
        return;
      }

      // Undo / Redo (unless editing text)
      if ((e.ctrlKey || e.metaKey) && tools.activeTool !== 'text') {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePopover, redo, setAboutDialogOpen, setExportDialogOpen, setPageOverviewOpen, setPageSettingsOpen, tools.activeTool, undo]);

  // Center & Fit page to view
  const handleFitToView = useCallback(() => {
    const { width: pageW } = PageEngine.getPageDimensions(currentDoc.settings.page.orientation);
    const containerW = window.innerWidth - 64; // Account for tool rail
    const containerH = window.innerHeight - 48; // Account for top bar

    // Fit with comfortable margins
    const zoomW = (containerW - 80) / pageW;
    const targetZoom = Math.min(1.4, Math.max(0.5, zoomW));
    const targetPanX = (containerW - pageW * targetZoom) / 2;
    const targetPanY = 40;

    setViewport({
      zoom: targetZoom,
      panX: targetPanX,
      panY: targetPanY
    });
  }, [currentDoc.settings.page.orientation, setViewport]);

  // Initial fit on load
  useEffect(() => {
    handleFitToView();
  }, [handleFitToView]);

  // Jump to specific page
  const handleJumpToPage = (pageIndex: number) => {
    const bounds = PageEngine.getPageBounds(pageIndex, {
      mode: currentDoc.settings.mode,
      scrollDirection: currentDoc.settings.scrollDirection,
      orientation: currentDoc.settings.page.orientation
    });

    const containerW = window.innerWidth - 64;
    setViewport((prev) => ({
      ...prev,
      panX: (containerW - bounds.width * prev.zoom) / 2,
      panY: -bounds.y * prev.zoom + 50
    }));
  };

  // Add a new page
  const handleAddPage = () => {
    setPageCount(currentDoc.content.pageCount + 1);
  };

  // Delete a page
  const handleDeletePage = (pageIndex: number) => {
    if (currentDoc.content.pageCount <= 1) return;
    deletePage(pageIndex);
    const remainingCount = currentDoc.content.pageCount - 1;
    const targetPage = Math.min(pageIndex, remainingCount - 1);
    handleJumpToPage(Math.max(0, targetPage));
  };

  // Insert image file
  const handleInsertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Place in center of view
        const targetW = Math.min(400, img.width);
        const targetH = (img.height / img.width) * targetW;
        const centerWorldX = (-viewport.panX + (window.innerWidth - 64) / 2) / viewport.zoom - targetW / 2;
        const centerWorldY = (-viewport.panY + (window.innerHeight - 48) / 2) / viewport.zoom - targetH / 2;

        addImage({
          id: `img-${Date.now()}`,
          src,
          x: Math.max(50, centerWorldX),
          y: Math.max(50, centerWorldY),
          width: targetW,
          height: targetH
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  if (appMode === 'library') {
    return (
      <>
        <LibraryView
        documents={docList}
        folders={folders}
        currentDocId={currentDoc.id}
        onSelectDocument={(doc) => {
          setDocument(doc);
          setAppMode('editor');
        }}
        onCreateNotebook={(title, tpl, color, folderId) => {
          createNotebook(title, tpl, color, folderId);
        }}
        onDuplicateNotebook={duplicateNotebook}
        onSoftDeleteNotebook={softDeleteNotebook}
        onRestoreNotebook={restoreNotebook}
        onDeleteNotebookPermanent={deleteNotebook}
        onEmptyRecycleBin={emptyRecycleBin}
        onMoveToFolder={moveToFolder}
        onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onOpenSettings={() => setCloudSettingsOpen(true)}
        />
        <CloudSettingsDialog
          isOpen={cloudSettingsOpen}
          documents={docList}
          onClose={() => setCloudSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#161514] text-[#e8e6e3] select-none">
      {/* Top Navigation Bar */}
      <TopBar
        document={currentDoc}
        onBackToLibrary={() => setAppMode('library')}
        onUpdateTitle={updateTitle}
        onOpenPageOverview={() => setPageOverviewOpen(true)}
        onOpenPageSettings={() => setPageSettingsOpen(true)}
        onOpenExportDialog={() => setExportDialogOpen(true)}
        onOpenAboutDialog={() => setAboutDialogOpen(true)}
        onInsertImage={handleInsertImage}
        onAddPage={handleAddPage}
        onModeChange={(mode) => updateDocumentSettings({ mode })}
        onFitToView={handleFitToView}
        onClearCanvas={clearCanvas}
        onDeleteDocument={() => deleteNotebook(currentDoc.id)}
      />

      {/* Main Workspace: Left Tool Rail + Drawing/Document Surface */}
      <div className="relative flex flex-1 overflow-hidden" onClick={closePopover}>
        {/* Left Vertical Tool Rail */}
        <ToolRail
          tools={tools}
          canUndo={canUndo}
          canRedo={canRedo}
          onSelectTool={setActiveTool}
          onTogglePopover={togglePopover}
          onClosePopover={closePopover}
          onUpdatePen={updatePenConfig}
          onUpdateHighlighter={updateHighlighterConfig}
          onUpdateEraser={updateEraserConfig}
          onUpdateShapes={updateShapesConfig}
          onClearCanvas={clearCanvas}
          onUndo={undo}
          onRedo={redo}
        />

        {/* Central Writing & Drawing Surface */}
        <main className="relative flex-1 overflow-hidden bg-[#121110]">
          <CanvasEngine
            document={currentDoc}
            tools={tools}
            viewport={viewport}
            onUpdateViewport={setViewport}
            onAddStroke={addStroke}
            onAddShape={addShape}
            onEraseStroke={eraseStrokeById}
            onEraseStrokes={eraseStrokesByIds}
            onEraseArea={eraseArea}
            onReplaceStrokes={replaceStrokes}
            onSetLassoSelection={setLassoSelection}
            onDeleteSelection={deleteSelection}
            onDuplicateSelection={duplicateSelection}
            onTransformSelection={transformSelection}
            onUpdateText={updateTextHtml}
            onSetPageCount={setPageCount}
            customTemplateImage={customTemplateImage}
          />

          {/* Subtle Bottom Status Indicator (Page & Zoom) */}
          <div className="pointer-events-none absolute bottom-3 right-4 z-20 flex items-center">
            <button
              onClick={() => setPageOverviewOpen(true)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[#262422] bg-[#141312]/80 px-2.5 py-1 font-editorial-mono text-[11px] text-[#85817a] shadow-sm backdrop-blur-md transition-colors hover:border-[#3e3b37] hover:text-[#d6d3cd]"
              title="Click to open page overview"
            >
              {currentDoc.settings.mode === 'infinite-canvas' ? (
                <span>Canvas · {Math.round(viewport.zoom * 100)}%</span>
              ) : (
                <span>
                  1 / {currentDoc.content.pageCount} · {Math.round(viewport.zoom * 100)}%
                </span>
              )}
            </button>
          </div>
        </main>
      </div>

      {/* Page & Template Settings Dialog */}
      <PageSettingsDialog
        isOpen={pageSettingsOpen}
        settings={currentDoc.settings.page}
        onUpdate={updatePageSettings}
        onClose={() => setPageSettingsOpen(false)}
        onCustomImageLoaded={(img) => setCustomTemplateImage(img)}
      />

      {/* Page Overview Drawer */}
      <PageOverviewDrawer
        isOpen={pageOverviewOpen}
        document={currentDoc}
        onClose={() => setPageOverviewOpen(false)}
        onJumpToPage={handleJumpToPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        document={currentDoc}
        onClose={() => setExportDialogOpen(false)}
        customTemplateImage={customTemplateImage}
      />

      <CloudSettingsDialog
        isOpen={cloudSettingsOpen}
        documents={docList}
        onClose={() => setCloudSettingsOpen(false)}
      />

      {/* About & Guide Dialog */}
      <AboutDialog
        isOpen={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />
    </div>
  );
}
export default App;
