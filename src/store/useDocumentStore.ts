import { useState, useEffect, useCallback, useRef } from 'react';
import {
  NotebookDocument,
  DocumentSettings,
  PageSettings,
  InkStroke,
  ShapeItem,
  ImageItem,
  ToolSettings,
  ViewportState,
  ActiveTool,
  DocumentContent,
  PaperColor,
  TemplateType,
  TemplateVariation,
  Folder
} from '../types/document';
import { db, DEFAULT_SEED_DOCUMENT, initializeDatabase } from '../storage/db';
import { distanceToSegment, distance } from '../utils/geometry';
import { PageEngine, PAGE_GAP_SPLIT, PAGE_GAP_SCROLL } from '../pages/PageEngine';

export const INITIAL_TOOL_SETTINGS: ToolSettings = {
  activeTool: 'pen',
  activePopover: null,
  pen: {
    preset: 'fountain',
    lineType: 'pressure-variable',
    width: 3.5,
    color: '#1c1917',
    straightenLines: false,
    shapeRecognition: false,
    recentColors: ['#1c1917', '#44403c', '#78716c', '#a8a29e', '#f5f5f4']
  },
  highlighter: {
    width: 24,
    color: '#a8a29e',
    opacity: 0.35,
    straightenLines: false,
    shapeRecognition: false
  },
  eraser: {
    type: 'stroke',
    size: 20
  },
  shapes: {
    shape: 'rectangle',
    width: 2,
    color: '#1c1917',
    fill: 'none',
    recognition: false
  },
  lasso: {
    selectedStrokeIds: [],
    selectedShapeIds: [],
    selectedImageIds: [],
    bounds: null
  }
};

const MAX_HISTORY = 40;

export function useDocumentStore() {
  const [currentDoc, setCurrentDoc] = useState<NotebookDocument>(DEFAULT_SEED_DOCUMENT);
  const [docList, setDocList] = useState<NotebookDocument[]>([]);
  const [tools, setTools] = useState<ToolSettings>(INITIAL_TOOL_SETTINGS);
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1.0, panX: 0, panY: 0 });
  const [appMode, setAppMode] = useState<'editor' | 'library'>('editor');

  // Dialogs
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [pageOverviewOpen, setPageOverviewOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  // Undo / Redo history stacks
  const historyRef = useRef<{
    undoStack: DocumentContent[];
    redoStack: DocumentContent[];
  }>({
    undoStack: [],
    redoStack: []
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Autosave timer
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh document list
  const refreshDocList = useCallback(async () => {
    try {
      const all = await db.documents.orderBy('updatedAt').reverse().toArray();
      setDocList(all);
    } catch (e) {
      console.error('Failed to list documents', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    initializeDatabase().then((initial) => {
      setCurrentDoc(initial);
      refreshDocList();
    });
  }, [refreshDocList]);

  // Push snapshot to undo stack
  const pushHistory = useCallback((currentContent: DocumentContent) => {
    const copy = JSON.parse(JSON.stringify(currentContent));
    historyRef.current.undoStack.push(copy);
    if (historyRef.current.undoStack.length > MAX_HISTORY) {
      historyRef.current.undoStack.shift();
    }
    historyRef.current.redoStack = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Schedule autosave
  const scheduleSave = useCallback((docToSave: NotebookDocument) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const updated = { ...docToSave, updatedAt: Date.now() };
        await db.documents.put(updated);
        refreshDocList();
      } catch (err) {
        console.error('Autosave error', err);
      }
    }, 400);
  }, [refreshDocList]);

  // Save immediately
  const saveNow = useCallback(async (docToSave: NotebookDocument) => {
    try {
      const updated = { ...docToSave, updatedAt: Date.now() };
      await db.documents.put(updated);
      refreshDocList();
    } catch (err) {
      console.error('Immediate save error', err);
    }
  }, [refreshDocList]);

  // Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentDoc) {
        db.documents.put({ ...currentDoc, updatedAt: Date.now() });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentDoc]);

  // Undo action
  const undo = useCallback(() => {
    if (historyRef.current.undoStack.length === 0) return;
    const currentContentCopy = JSON.parse(JSON.stringify(currentDoc.content));
    const previous = historyRef.current.undoStack.pop()!;
    historyRef.current.redoStack.push(currentContentCopy);

    setCurrentDoc((prev) => {
      const next = { ...prev, content: previous, updatedAt: Date.now() };
      scheduleSave(next);
      return next;
    });

    setCanUndo(historyRef.current.undoStack.length > 0);
    setCanRedo(true);
  }, [currentDoc, scheduleSave]);

  // Redo action
  const redo = useCallback(() => {
    if (historyRef.current.redoStack.length === 0) return;
    const currentContentCopy = JSON.parse(JSON.stringify(currentDoc.content));
    const nextContent = historyRef.current.redoStack.pop()!;
    historyRef.current.undoStack.push(currentContentCopy);

    setCurrentDoc((prev) => {
      const next = { ...prev, content: nextContent, updatedAt: Date.now() };
      scheduleSave(next);
      return next;
    });

    setCanUndo(true);
    setCanRedo(historyRef.current.redoStack.length > 0);
  }, [currentDoc, scheduleSave]);

  // Document manipulations
  const setDocument = useCallback((doc: NotebookDocument) => {
    historyRef.current.undoStack = [];
    historyRef.current.redoStack = [];
    setCanUndo(false);
    setCanRedo(false);
    setCurrentDoc(doc);
    setAppMode('editor');
    // Reset selection
    setTools((prev) => ({
      ...prev,
      lasso: { selectedStrokeIds: [], selectedShapeIds: [], selectedImageIds: [], bounds: null }
    }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setCurrentDoc((prev) => {
      const next = { ...prev, title: title.trim() || 'Untitled Note', updatedAt: Date.now() };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const updateDocumentSettings = useCallback((newSettings: Partial<DocumentSettings>) => {
    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings,
          page: {
            ...prev.settings.page,
            ...(newSettings.page || {})
          }
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const updatePageSettings = useCallback((pageSettings: Partial<PageSettings>) => {
    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          page: {
            ...prev.settings.page,
            ...pageSettings
          }
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const addStroke = useCallback((stroke: InkStroke) => {
    setCurrentDoc((prev) => {
      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: [...prev.content.strokes, stroke]
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const addShape = useCallback((shape: ShapeItem) => {
    setCurrentDoc((prev) => {
      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          shapes: [...prev.content.shapes, shape]
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const addImage = useCallback((image: ImageItem) => {
    pushHistory(currentDoc.content);
    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        content: {
          ...prev.content,
          images: [...prev.content.images, image]
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [currentDoc.content, pushHistory, scheduleSave]);

  const updateTextHtml = useCallback((html: string) => {
    setCurrentDoc((prev) => {
      if (prev.content.textHtml === html) return prev;
      const next = {
        ...prev,
        content: {
          ...prev.content,
          textHtml: html
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const setPageCount = useCallback((count: number) => {
    setCurrentDoc((prev) => {
      if (prev.content.pageCount === count) return prev;
      const next = {
        ...prev,
        content: {
          ...prev.content,
          pageCount: Math.max(1, count)
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const deletePage = useCallback((pageIndex: number) => {
    setCurrentDoc((prev) => {
      if (prev.content.pageCount <= 1) return prev;
      pushHistory(prev.content);

      const pageDims = PageEngine.getPageDimensions(prev.settings.page.orientation);
      const isSplit = prev.settings.mode === 'split-pages';
      const gap = isSplit ? PAGE_GAP_SPLIT : PAGE_GAP_SCROLL;
      const pageHeight = pageDims.height;
      const targetBounds = PageEngine.getPageBounds(pageIndex, {
        mode: prev.settings.mode,
        scrollDirection: prev.settings.scrollDirection,
        orientation: prev.settings.page.orientation
      });

      const shiftY = pageHeight + gap;

      // 1. Remove strokes whose center is on deleted page, shift subsequent strokes up
      const nextStrokes: InkStroke[] = [];
      for (const stroke of prev.content.strokes) {
        let minY = Infinity;
        let maxY = -Infinity;
        for (const pt of stroke.points) {
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }
        const strokeCenterY = (minY + maxY) / 2;

        if (strokeCenterY >= targetBounds.y - 10 && strokeCenterY <= targetBounds.y + targetBounds.height + 10) {
          // Inside deleted page: remove
          continue;
        } else if (strokeCenterY > targetBounds.y + targetBounds.height + 10) {
          // Below deleted page: shift up
          nextStrokes.push({
            ...stroke,
            points: stroke.points.map((p) => ({ ...p, y: p.y - shiftY }))
          });
        } else {
          nextStrokes.push(stroke);
        }
      }

      // 2. Remove shapes on deleted page, shift subsequent shapes up
      const nextShapes: ShapeItem[] = [];
      for (const sh of prev.content.shapes) {
        const centerY = (sh.startY + sh.endY) / 2;
        if (centerY >= targetBounds.y - 10 && centerY <= targetBounds.y + targetBounds.height + 10) {
          continue;
        } else if (centerY > targetBounds.y + targetBounds.height + 10) {
          nextShapes.push({
            ...sh,
            startY: sh.startY - shiftY,
            endY: sh.endY - shiftY
          });
        } else {
          nextShapes.push(sh);
        }
      }

      // 3. Remove images on deleted page, shift subsequent images up
      const nextImages: ImageItem[] = [];
      for (const img of prev.content.images) {
        const centerY = img.y + img.height / 2;
        if (centerY >= targetBounds.y - 10 && centerY <= targetBounds.y + targetBounds.height + 10) {
          continue;
        } else if (centerY > targetBounds.y + targetBounds.height + 10) {
          nextImages.push({
            ...img,
            y: img.y - shiftY
          });
        } else {
          nextImages.push(img);
        }
      }

      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: nextStrokes,
          shapes: nextShapes,
          images: nextImages,
          pageCount: Math.max(1, prev.content.pageCount - 1)
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const eraseStrokeById = useCallback((strokeId: string) => {
    setCurrentDoc((prev) => {
      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: prev.content.strokes.filter((s) => s.id !== strokeId)
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const eraseStrokesByIds = useCallback((strokeIds: Set<string>) => {
    if (strokeIds.size === 0) return;
    setCurrentDoc((prev) => {
      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: prev.content.strokes.filter((s) => !strokeIds.has(s.id))
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const replaceStrokes = useCallback((strokes: InkStroke[]) => {
    setCurrentDoc((prev) => {
      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  // Area eraser: clips intersecting portions of strokes
  const eraseArea = useCallback((center: { x: number; y: number }, radius: number) => {
    setCurrentDoc((prev) => {
      let modified = false;
      const newStrokes: InkStroke[] = [];

      for (const stroke of prev.content.strokes) {
        // Check if stroke intersects circle
        let hasIntersection = false;
        for (const p of stroke.points) {
          if (distance(p, center) <= radius) {
            hasIntersection = true;
            break;
          }
        }

        if (!hasIntersection) {
          newStrokes.push(stroke);
        } else {
          modified = true;
          // Split stroke into sub-segments omitting points inside the circle
          const segments: (typeof stroke.points)[] = [];
          let curSegment: typeof stroke.points = [];

          for (const p of stroke.points) {
            if (distance(p, center) > radius) {
              curSegment.push(p);
            } else {
              if (curSegment.length >= 2) {
                segments.push(curSegment);
              }
              curSegment = [];
            }
          }
          if (curSegment.length >= 2) {
            segments.push(curSegment);
          }

          // Add back non-erased fragments
          segments.forEach((segPoints, idx) => {
            newStrokes.push({
              ...stroke,
              id: `${stroke.id}-part-${idx}-${Date.now()}`,
              points: segPoints
            });
          });
        }
      }

      if (!modified) return prev;

      pushHistory(prev.content);
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: newStrokes
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [pushHistory, scheduleSave]);

  const clearCanvas = useCallback(() => {
    pushHistory(currentDoc.content);
    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: [],
          shapes: [],
          images: [],
          textHtml: ''
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });
  }, [currentDoc.content, pushHistory, scheduleSave]);

  // Tool management
  const setActiveTool = useCallback((tool: ActiveTool) => {
    setTools((prev) => ({
      ...prev,
      activeTool: tool,
      activePopover: null // Close popover when selecting different tool
    }));
  }, []);

  const togglePopover = useCallback((tool: ActiveTool) => {
    setTools((prev) => {
      const isOpen = prev.activePopover === tool;
      return {
        ...prev,
        activeTool: tool,
        activePopover: isOpen ? null : tool
      };
    });
  }, []);

  const closePopover = useCallback(() => {
    setTools((prev) => ({ ...prev, activePopover: null }));
  }, []);

  const updatePenConfig = useCallback((config: Partial<ToolSettings['pen']>) => {
    setTools((prev) => ({
      ...prev,
      pen: { ...prev.pen, ...config }
    }));
  }, []);

  const updateHighlighterConfig = useCallback((config: Partial<ToolSettings['highlighter']>) => {
    setTools((prev) => ({
      ...prev,
      highlighter: { ...prev.highlighter, ...config }
    }));
  }, []);

  const updateEraserConfig = useCallback((config: Partial<ToolSettings['eraser']>) => {
    setTools((prev) => ({
      ...prev,
      eraser: { ...prev.eraser, ...config }
    }));
  }, []);

  const updateShapesConfig = useCallback((config: Partial<ToolSettings['shapes']>) => {
    setTools((prev) => ({
      ...prev,
      shapes: { ...prev.shapes, ...config }
    }));
  }, []);

  const setLassoSelection = useCallback((selection: ToolSettings['lasso']) => {
    setTools((prev) => ({
      ...prev,
      lasso: selection
    }));
  }, []);

  // Selection manipulations (Move, Duplicate, Delete)
  const deleteSelection = useCallback(() => {
    const { selectedStrokeIds, selectedShapeIds, selectedImageIds } = tools.lasso;
    if (selectedStrokeIds.length === 0 && selectedShapeIds.length === 0 && selectedImageIds.length === 0) return;

    pushHistory(currentDoc.content);
    const strokeSet = new Set(selectedStrokeIds);
    const shapeSet = new Set(selectedShapeIds);
    const imageSet = new Set(selectedImageIds);

    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: prev.content.strokes.filter((s) => !strokeSet.has(s.id)),
          shapes: prev.content.shapes.filter((sh) => !shapeSet.has(sh.id)),
          images: prev.content.images.filter((img) => !imageSet.has(img.id))
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });

    setTools((prev) => ({
      ...prev,
      lasso: { selectedStrokeIds: [], selectedShapeIds: [], selectedImageIds: [], bounds: null }
    }));
  }, [currentDoc.content, pushHistory, scheduleSave, tools.lasso]);

  const duplicateSelection = useCallback(() => {
    const { selectedStrokeIds, selectedShapeIds, selectedImageIds, bounds } = tools.lasso;
    if (!bounds) return;

    pushHistory(currentDoc.content);
    const offset = 30;

    const strokeSet = new Set(selectedStrokeIds);
    const shapeSet = new Set(selectedShapeIds);
    const imageSet = new Set(selectedImageIds);

    const newStrokes: InkStroke[] = [];
    const newShapes: ShapeItem[] = [];
    const newImages: ImageItem[] = [];

    const newStrokeIds: string[] = [];
    const newShapeIds: string[] = [];
    const newImageIds: string[] = [];

    for (const stroke of currentDoc.content.strokes) {
      if (strokeSet.has(stroke.id)) {
        const newId = `dup-stroke-${Date.now()}-${Math.random()}`;
        newStrokeIds.push(newId);
        newStrokes.push({
          ...stroke,
          id: newId,
          points: stroke.points.map((p) => ({ ...p, x: p.x + offset, y: p.y + offset }))
        });
      }
    }

    for (const shape of currentDoc.content.shapes) {
      if (shapeSet.has(shape.id)) {
        const newId = `dup-shape-${Date.now()}-${Math.random()}`;
        newShapeIds.push(newId);
        newShapes.push({
          ...shape,
          id: newId,
          startX: shape.startX + offset,
          startY: shape.startY + offset,
          endX: shape.endX + offset,
          endY: shape.endY + offset
        });
      }
    }

    for (const image of currentDoc.content.images) {
      if (imageSet.has(image.id)) {
        const newId = `dup-image-${Date.now()}-${Math.random()}`;
        newImageIds.push(newId);
        newImages.push({
          ...image,
          id: newId,
          x: image.x + offset,
          y: image.y + offset
        });
      }
    }

    setCurrentDoc((prev) => {
      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: [...prev.content.strokes, ...newStrokes],
          shapes: [...prev.content.shapes, ...newShapes],
          images: [...prev.content.images, ...newImages]
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });

    setTools((prev) => ({
      ...prev,
      lasso: {
        selectedStrokeIds: newStrokeIds,
        selectedShapeIds: newShapeIds,
        selectedImageIds: newImageIds,
        bounds: {
          x: bounds.x + offset,
          y: bounds.y + offset,
          width: bounds.width,
          height: bounds.height
        }
      }
    }));
  }, [currentDoc.content, pushHistory, scheduleSave, tools.lasso]);

  const transformSelection = useCallback((dx: number, dy: number) => {
    const { selectedStrokeIds, selectedShapeIds, selectedImageIds, bounds } = tools.lasso;
    if (!bounds) return;

    const strokeSet = new Set(selectedStrokeIds);
    const shapeSet = new Set(selectedShapeIds);
    const imageSet = new Set(selectedImageIds);

    setCurrentDoc((prev) => {
      const nextStrokes = prev.content.strokes.map((s) => {
        if (!strokeSet.has(s.id)) return s;
        return {
          ...s,
          points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
        };
      });

      const nextShapes = prev.content.shapes.map((sh) => {
        if (!shapeSet.has(sh.id)) return sh;
        return {
          ...sh,
          startX: sh.startX + dx,
          startY: sh.startY + dy,
          endX: sh.endX + dx,
          endY: sh.endY + dy
        };
      });

      const nextImages = prev.content.images.map((img) => {
        if (!imageSet.has(img.id)) return img;
        return {
          ...img,
          x: img.x + dx,
          y: img.y + dy
        };
      });

      const next = {
        ...prev,
        content: {
          ...prev.content,
          strokes: nextStrokes,
          shapes: nextShapes,
          images: nextImages
        },
        updatedAt: Date.now()
      };
      scheduleSave(next);
      return next;
    });

    setTools((prev) => ({
      ...prev,
      lasso: {
        ...prev.lasso,
        bounds: {
          ...bounds,
          x: bounds.x + dx,
          y: bounds.y + dy
        }
      }
    }));
  }, [scheduleSave, tools.lasso]);

  const [folders, setFolders] = useState<Folder[]>([
    { id: 'folder-personal', name: 'Personal', parentId: null },
    { id: 'folder-personal-journal', name: 'Journal & Ideas', parentId: 'folder-personal' },
    { id: 'folder-academics', name: 'Academics', parentId: null },
    { id: 'folder-physics-11', name: '11th Physics', parentId: 'folder-academics' },
    { id: 'folder-math-12', name: '12th Math', parentId: 'folder-academics' },
    { id: 'folder-brilliant', name: 'Brilliant Coaching', parentId: null },
    { id: 'folder-junk', name: 'Junk', parentId: null }
  ]);

  // Notebook library management: Fast creation ("Hop straight in")
  const createNotebook = useCallback(async (
    title = '',
    templateType: TemplateType = 'lined',
    paperColor: PaperColor = '#fbfbf8',
    folderId?: string
  ) => {
    const activeCount = docList.filter((d) => !d.isDeleted).length + 1;
    const finalTitle = title.trim() || `Note ${activeCount}`;

    const newDoc: NotebookDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: finalTitle,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        mode: 'split-pages',
        scrollDirection: 'vertical',
        page: {
          size: 'A4',
          orientation: 'portrait',
          backgroundColor: paperColor,
          template: {
            type: templateType,
            variation: 'standard'
          }
        }
      },
      content: {
        pageCount: 1,
        textHtml: '',
        strokes: [],
        shapes: [],
        images: []
      }
    };

    await db.documents.add(newDoc);
    setDocument(newDoc);
    setAppMode('editor');
    refreshDocList();
    return newDoc;
  }, [docList, refreshDocList, setAppMode, setDocument]);

  const softDeleteNotebook = useCallback(async (id: string) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    const updated = { ...doc, isDeleted: true, updatedAt: Date.now() };
    await db.documents.put(updated);
    refreshDocList();
  }, [refreshDocList]);

  const restoreNotebook = useCallback(async (id: string) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    const updated = { ...doc, isDeleted: false, updatedAt: Date.now() };
    await db.documents.put(updated);
    refreshDocList();
  }, [refreshDocList]);

  const emptyRecycleBin = useCallback(async () => {
    const all = await db.documents.toArray();
    const deletedIds = all.filter((d) => d.isDeleted).map((d) => d.id);
    if (deletedIds.length > 0) {
      await db.documents.bulkDelete(deletedIds);
      refreshDocList();
    }
  }, [refreshDocList]);

  const moveToFolder = useCallback(async (id: string, folderId: string | undefined) => {
    const doc = await db.documents.get(id);
    if (!doc) return;
    const updated = { ...doc, folderId, updatedAt: Date.now() };
    await db.documents.put(updated);
    refreshDocList();
  }, [refreshDocList]);

  const createFolder = useCallback((name: string, parentId?: string | null) => {
    if (!name.trim()) return;
    const newF: Folder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      parentId: parentId || null
    };
    setFolders((prev) => [...prev, newF]);
  }, []);

  const replaceFolders = useCallback((nextFolders: Folder[]) => {
    setFolders(nextFolders);
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => {
      const idsToDelete = new Set<string>([folderId]);
      let changed = true;
      while (changed) {
        changed = false;
        prev.forEach((folder) => {
          if (folder.parentId && idsToDelete.has(folder.parentId) && !idsToDelete.has(folder.id)) {
            idsToDelete.add(folder.id);
            changed = true;
          }
        });
      }
      setDocList((docs) => docs.map((doc) => (
        doc.folderId && idsToDelete.has(doc.folderId)
          ? { ...doc, folderId: undefined }
          : doc
      )));
      return prev.filter((folder) => !idsToDelete.has(folder.id));
    });
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    await db.documents.delete(id);
    const remaining = await db.documents.orderBy('updatedAt').reverse().toArray();
    setDocList(remaining);
    if (currentDoc.id === id) {
      if (remaining.length > 0) {
        setDocument(remaining[0]);
      } else {
        const fresh = { ...DEFAULT_SEED_DOCUMENT, id: `doc-${Date.now()}` };
        await db.documents.add(fresh);
        setDocument(fresh);
      }
    }
  }, [currentDoc.id, setDocument]);

  const duplicateNotebook = useCallback(async (id: string) => {
    const source = await db.documents.get(id);
    if (!source) return;
    const duplicated: NotebookDocument = {
      ...JSON.parse(JSON.stringify(source)),
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `${source.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.documents.add(duplicated);
    refreshDocList();
  }, [refreshDocList]);

  return {
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
    pushHistory,
    undo,
    redo,
    saveNow,
    createNotebook,
    deleteNotebook,
    duplicateNotebook,
    softDeleteNotebook,
    restoreNotebook,
    emptyRecycleBin,
    moveToFolder,
      folders,
      createFolder,
      replaceFolders,
      deleteFolder,
      refreshDocList
  };
}
