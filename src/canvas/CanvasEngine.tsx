import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  NotebookDocument,
  ToolSettings,
  ViewportState,
  InkStroke,
  ShapeItem,
  Point
} from '../types/document';
import { PageEngine, PAGE_GAP_SPLIT, PAGE_GAP_SCROLL } from '../pages/PageEngine';
import { PageGenerationController } from '../pages/PageGenerationController';
import { TemplateRenderer } from './TemplateRenderer';
import { StrokeRenderer } from './StrokeRenderer';
import { ShapeRenderer } from './ShapeRenderer';
import { StrokeSpatialIndex } from './SpatialIndex';
import { EraserEngine } from './EraserEngine';
import {
  distance,
  isPointInPolygon,
  getPointsBounds
} from '../utils/geometry';
import { LassoFloatingBar } from '../components/Popovers/LassoFloatingBar';
import { RichTextDocument } from '../editor/RichTextDocument';
import { TextToolbar } from '../editor/TextToolbar';

interface CanvasEngineProps {
  document: NotebookDocument;
  tools: ToolSettings;
  viewport: ViewportState;
  onUpdateViewport: (vp: ViewportState | ((prev: ViewportState) => ViewportState)) => void;
  onAddStroke: (stroke: InkStroke) => void;
  onAddShape: (shape: ShapeItem) => void;
  onEraseStroke: (strokeId: string) => void;
  onEraseStrokes: (strokeIds: Set<string>) => void;
  onEraseArea: (center: { x: number; y: number }, radius: number) => void;
  onReplaceStrokes?: (strokes: InkStroke[]) => void;
  onSetLassoSelection: (sel: ToolSettings['lasso']) => void;
  onDeleteSelection: () => void;
  onDuplicateSelection: () => void;
  onTransformSelection: (dx: number, dy: number) => void;
  onUpdateText: (html: string) => void;
  onSetPageCount: (count: number) => void;
  customTemplateImage?: HTMLImageElement | null;
}

export const CanvasEngine: React.FC<CanvasEngineProps> = ({
  document: doc,
  tools,
  viewport,
  onUpdateViewport,
  onAddStroke,
  onAddShape,
  onEraseStroke: _onEraseStroke,
  onEraseStrokes: _onEraseStrokes,
  onEraseArea: _onEraseArea,
  onReplaceStrokes,
  onSetLassoSelection,
  onDeleteSelection,
  onDuplicateSelection,
  onTransformSelection,
  onUpdateText,
  onSetPageCount,
  customTemplateImage
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  // Spatial indexing for high-performance bounding box queries
  const spatialIndexRef = useRef<StrokeSpatialIndex>(new StrokeSpatialIndex());

  // In-memory working strokes for zero-lag live erasing
  const workingStrokesRef = useRef<InkStroke[]>(doc.content.strokes);
  const isErasingRef = useRef(false);
  const eraserModifiedRef = useRef(false);
  const lastEraserPosRef = useRef<{ x: number; y: number } | null>(null);

  // Transient drawing state
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastDrawnIndexRef = useRef<number>(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  // Selection drag state
  const isDraggingSelectionRef = useRef(false);
  const selectionDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating lasso screen position
  const [lassoScreenPos, setLassoScreenPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render throttle guard for static canvas
  const mainRenderScheduledRef = useRef(false);

  // Keep working strokes and spatial index in sync with document when not actively erasing
  useEffect(() => {
    if (!isErasingRef.current) {
      workingStrokesRef.current = doc.content.strokes;
      spatialIndexRef.current.sync(doc.content.strokes);
    }
  }, [doc.content.strokes]);

  // Screen to world coordinates transform
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: screenX, y: screenY };
      const mouseX = screenX - rect.left;
      const mouseY = screenY - rect.top;
      return {
        x: (mouseX - viewport.panX) / viewport.zoom,
        y: (mouseY - viewport.panY) / viewport.zoom
      };
    },
    [viewport.panX, viewport.panY, viewport.zoom]
  );

  // World to screen coordinates transform
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } => {
      const rect = containerRef.current?.getBoundingClientRect();
      const offsetX = rect ? rect.left : 0;
      const offsetY = rect ? rect.top : 0;
      return {
        x: worldX * viewport.zoom + viewport.panX + offsetX,
        y: worldY * viewport.zoom + viewport.panY + offsetY
      };
    },
    [viewport.panX, viewport.panY, viewport.zoom]
  );

  // Demand-driven page generation controller
  const pageGenControllerRef = useRef<PageGenerationController>(
    new PageGenerationController(doc.id)
  );

  useEffect(() => {
    pageGenControllerRef.current.reset(doc.id, doc.content.pageCount);
  }, [doc.id, doc.content.pageCount]);

  const handleScrollPageCheck = useCallback(
    (nextPanX: number, nextPanY: number) => {
      if (doc.settings.mode === 'infinite-canvas') return;
      const container = containerRef.current;
      if (!container) return;

      const shouldAdd = pageGenControllerRef.current.checkScrollTrigger(
        { panX: nextPanX, panY: nextPanY, zoom: viewport.zoom },
        { width: container.clientWidth, height: container.clientHeight },
        doc.content.pageCount,
        {
          mode: doc.settings.mode,
          scrollDirection: doc.settings.scrollDirection,
          orientation: doc.settings.page.orientation
        }
      );

      if (shouldAdd) {
        onSetPageCount(doc.content.pageCount + 1);
        pageGenControllerRef.current.completeGeneration();
      }
    },
    [doc.content.pageCount, doc.settings.mode, doc.settings.page.orientation, doc.settings.scrollDirection, onSetPageCount, viewport.zoom]
  );

  const handleContentPageCheck = useCallback(
    (maxY: number, maxX: number) => {
      if (doc.settings.mode === 'infinite-canvas') return;
      const shouldAdd = pageGenControllerRef.current.checkContentTrigger(
        maxY,
        maxX,
        doc.content.pageCount,
        {
          mode: doc.settings.mode,
          scrollDirection: doc.settings.scrollDirection,
          orientation: doc.settings.page.orientation
        }
      );

      if (shouldAdd) {
        onSetPageCount(doc.content.pageCount + 1);
        pageGenControllerRef.current.completeGeneration();
      }
    },
    [doc.content.pageCount, doc.settings.mode, doc.settings.page.orientation, doc.settings.scrollDirection, onSetPageCount]
  );

  // 1. Static Main Canvas Render: background, templates, committed strokes & shapes
  const renderMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark workspace background
    ctx.fillStyle = '#121110';
    ctx.fillRect(0, 0, width, height);

    // Apply viewport transform (pan & zoom)
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);

    const visibleWorld = {
      x: -viewport.panX / viewport.zoom,
      y: -viewport.panY / viewport.zoom,
      width: width / viewport.zoom,
      height: height / viewport.zoom
    };

    const isInfiniteCanvas = doc.settings.mode === 'infinite-canvas';
    const isSplit = doc.settings.mode === 'split-pages';

    if (isInfiniteCanvas) {
      ctx.fillStyle = doc.settings.page.backgroundColor;
      ctx.fillRect(visibleWorld.x, visibleWorld.y, visibleWorld.width, visibleWorld.height);

      TemplateRenderer.renderInfiniteCanvasBackground(
        ctx,
        visibleWorld,
        doc.settings.page.template,
        doc.settings.page.backgroundColor
      );
    } else {
      const pages = PageEngine.getAllPageBounds(doc.content.pageCount, {
        mode: doc.settings.mode,
        scrollDirection: doc.settings.scrollDirection,
        orientation: doc.settings.page.orientation
      });

      for (const p of pages) {
        ctx.save();
        if (isSplit) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;
        }

        ctx.fillStyle = doc.settings.page.backgroundColor;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.restore();

        TemplateRenderer.renderTemplate(
          ctx,
          p,
          doc.settings.page.template,
          doc.settings.page.backgroundColor,
          customTemplateImage
        );

        ctx.strokeStyle =
          doc.settings.page.backgroundColor === '#141312' || doc.settings.page.backgroundColor === '#292827'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        if (isSplit) {
          ctx.fillStyle =
            doc.settings.page.backgroundColor === '#141312' || doc.settings.page.backgroundColor === '#292827'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.25)';
          ctx.font = '11px "IBM Plex Mono", monospace';
          ctx.fillText(`${p.pageIndex + 1}`, p.x + p.width - 32, p.y + p.height - 20);
        }
      }
    }

    // Render strokes: use in-memory workingStrokes (synced with doc.content.strokes when idle)
    const strokesToRender = workingStrokesRef.current;

    // Highlighters first (underneath ink)
    for (let i = 0; i < strokesToRender.length; i++) {
      const s = strokesToRender[i];
      if (s.isHighlighter) {
        StrokeRenderer.drawStroke(ctx, s);
      }
    }

    // Images
    for (let i = 0; i < doc.content.images.length; i++) {
      const imgItem = doc.content.images[i];
      const img = new Image();
      img.src = imgItem.src;
      if (img.complete) {
        ctx.drawImage(img, imgItem.x, imgItem.y, imgItem.width, imgItem.height);
      }
    }

    // Shapes
    for (let i = 0; i < doc.content.shapes.length; i++) {
      ShapeRenderer.drawShape(ctx, doc.content.shapes[i]);
    }

    // Pen strokes
    for (let i = 0; i < strokesToRender.length; i++) {
      const s = strokesToRender[i];
      if (!s.isHighlighter) {
        StrokeRenderer.drawStroke(ctx, s);
      }
    }

    // Lasso selection box
    if (tools.lasso.bounds) {
      const b = tools.lasso.bounds;
      ctx.save();
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);

      ctx.fillStyle = '#f5f4f0';
      ctx.strokeStyle = '#292524';
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      const handleSize = 6;
      const corners = [
        { x: b.x - 4, y: b.y - 4 },
        { x: b.x + b.width + 4, y: b.y - 4 },
        { x: b.x - 4, y: b.y + b.height + 4 },
        { x: b.x + b.width + 4, y: b.y + b.height + 4 }
      ];
      for (let i = 0; i < corners.length; i++) {
        const c = corners[i];
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      }
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }, [
    customTemplateImage,
    doc.content.images,
    doc.content.pageCount,
    doc.content.shapes,
    doc.content.strokes,
    doc.settings.mode,
    doc.settings.page.backgroundColor,
    doc.settings.page.orientation,
    doc.settings.page.template,
    doc.settings.scrollDirection,
    tools.lasso.bounds,
    viewport.panX,
    viewport.panY,
    viewport.zoom
  ]);

  // Request demand-driven render of static main canvas
  const requestMainRender = useCallback(() => {
    if (mainRenderScheduledRef.current) return;
    mainRenderScheduledRef.current = true;
    requestAnimationFrame(() => {
      mainRenderScheduledRef.current = false;
      renderMainCanvas();
    });
  }, [renderMainCanvas]);

  useEffect(() => {
    requestMainRender();
  }, [requestMainRender]);

  // Clear scratch active canvas
  const clearActiveCanvas = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Sync scratch canvas resolution with viewport / container
  const syncActiveCanvasSize = useCallback(() => {
    const canvas = activeCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  // Update floating lasso bar position
  useEffect(() => {
    if (tools.lasso.bounds) {
      const pos = worldToScreen(tools.lasso.bounds.x, tools.lasso.bounds.y);
      setLassoScreenPos(pos);
    }
  }, [tools.lasso.bounds, worldToScreen]);

  // Execute Eraser Action along path
  const applyEraserAt = useCallback(
    (worldX: number, worldY: number) => {
      const radius = tools.eraser.size / 2;
      const currentStrokes = workingStrokesRef.current;

      if (tools.eraser.type === 'stroke') {
        // Stroke Eraser: deletes entire stroke entities
        const res = EraserEngine.executeStrokeEraser(
          currentStrokes,
          spatialIndexRef.current,
          { x: worldX, y: worldY },
          radius
        );

        if (res.modified) {
          workingStrokesRef.current = res.updatedStrokes;
          spatialIndexRef.current.sync(res.updatedStrokes);
          eraserModifiedRef.current = true;
          requestMainRender();
        }
      } else {
        // Area Eraser: slices through lines, breaking into smaller sub-segments
        const res = EraserEngine.executeAreaEraser(
          currentStrokes,
          { x: worldX, y: worldY },
          radius
        );

        if (res.modified) {
          workingStrokesRef.current = res.updatedStrokes;
          spatialIndexRef.current.sync(res.updatedStrokes);
          eraserModifiedRef.current = true;
          requestMainRender();
        }
      }
    },
    [requestMainRender, tools.eraser.size, tools.eraser.type]
  );

  // Interpolate continuous eraser movement between consecutive pointer samples
  const handleContinuousEraser = useCallback(
    (worldPos: { x: number; y: number }) => {
      const radius = tools.eraser.size / 2;
      const last = lastEraserPosRef.current;
      if (!last) {
        lastEraserPosRef.current = worldPos;
        applyEraserAt(worldPos.x, worldPos.y);
        return;
      }

      const dist = distance(last, worldPos);
      const step = Math.max(5, radius * 0.4);
      const steps = Math.max(1, Math.ceil(dist / step));

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const cx = last.x + (worldPos.x - last.x) * t;
        const cy = last.y + (worldPos.y - last.y) * t;
        applyEraserAt(cx, cy);
      }

      lastEraserPosRef.current = worldPos;
    },
    [applyEraserAt, tools.eraser.size]
  );

  // Unified Active Scratch Canvas Render: 100% identical to committed stroke (zero jitter, zero glitch)
  const renderActiveCanvasContent = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { desynchronized: true, alpha: true });
    if (!ctx) return;

    clearActiveCanvas();

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);

    if (isDrawingRef.current && currentPointsRef.current.length > 0) {
      const pts = currentPointsRef.current;

      if (tools.activeTool === 'pen') {
        const activeStroke: InkStroke = {
          id: 'live-pen-stroke',
          points: pts,
          color: tools.pen.color,
          width: tools.pen.width,
          tool: tools.pen.preset,
          lineType: tools.pen.lineType || 'pressure-variable'
        };
        StrokeRenderer.drawStroke(ctx, activeStroke);
      } else if (tools.activeTool === 'highlighter') {
        const activeStroke: InkStroke = {
          id: 'live-hl-stroke',
          points: pts,
          color: tools.highlighter.color,
          width: tools.highlighter.width,
          tool: 'marker',
          isHighlighter: true,
          opacity: tools.highlighter.opacity
        };
        StrokeRenderer.drawStroke(ctx, activeStroke);
      } else if (tools.activeTool === 'shapes') {
        const start = pts[0];
        const end = pts[pts.length - 1];
        const activeShape: ShapeItem = {
          id: 'live-shape',
          type: tools.shapes.shape,
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          color: tools.shapes.color,
          width: tools.shapes.width,
          lineType: 'uniform',
          fill: tools.shapes.fill
        };
        ShapeRenderer.drawShape(ctx, activeShape);
      } else if (tools.activeTool === 'lasso') {
        if (pts.length >= 2) {
          ctx.strokeStyle = '#a8a29e';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [
    clearActiveCanvas,
    tools.activeTool,
    tools.highlighter.color,
    tools.highlighter.opacity,
    tools.highlighter.width,
    tools.pen.color,
    tools.pen.lineType,
    tools.pen.preset,
    tools.pen.width,
    tools.shapes.color,
    tools.shapes.fill,
    tools.shapes.shape,
    tools.shapes.width,
    viewport.panX,
    viewport.panY,
    viewport.zoom
  ]);

  // Update cursor position directly on DOM node via CSS translate3d (0ms tracking latency)
  const updateCursorPosition = (clientX: number, clientY: number) => {
    if (!cursorRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    // Pan with middle mouse or Alt key
    if (e.buttons === 4 || e.altKey) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (tools.activeTool === 'text') return;

    const world = screenToWorld(e.clientX, e.clientY);

    // Dragging selection in lasso mode
    if (tools.activeTool === 'lasso' && tools.lasso.bounds) {
      const b = tools.lasso.bounds;
      if (
        world.x >= b.x - 8 &&
        world.x <= b.x + b.width + 8 &&
        world.y >= b.y - 8 &&
        world.y <= b.y + b.height + 8
      ) {
        isDraggingSelectionRef.current = true;
        selectionDragStartRef.current = world;
        return;
      }
    }

    syncActiveCanvasSize();
    clearActiveCanvas();

    const isMouse = e.pointerType === 'mouse';
    const initialPoint: Point = {
      x: world.x,
      y: world.y,
      pressure: isMouse ? 0.5 : (e.pressure && e.pressure > 0 ? e.pressure : 0.5),
      timestamp: Date.now()
    };
    currentPointsRef.current = [initialPoint];
    lastDrawnIndexRef.current = 0;

    // Handle Eraser Mode
    if (tools.activeTool === 'eraser') {
      isErasingRef.current = true;
      eraserModifiedRef.current = false;
      workingStrokesRef.current = [...doc.content.strokes];
      spatialIndexRef.current.sync(doc.content.strokes);
      lastEraserPosRef.current = world;
      handleContinuousEraser(world);
      return;
    }

    // Start Live Vector Drawing
    isDrawingRef.current = true;
    renderActiveCanvasContent();
  };

  // Pointer Move handler (ultra-optimized low latency pipeline)
  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Immediately update custom brush cursor position (0ms latency, zero re-renders)
    updateCursorPosition(e.clientX, e.clientY);

    // Handle Panning
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      onUpdateViewport((prev) => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy
      }));
      return;
    }

    // Handle Lasso Selection Drag
    if (isDraggingSelectionRef.current) {
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = world.x - selectionDragStartRef.current.x;
      const dy = world.y - selectionDragStartRef.current.y;
      if (Math.hypot(dx, dy) > 1.5) {
        onTransformSelection(dx, dy);
        selectionDragStartRef.current = world;
      }
      return;
    }

    // Handle Active Eraser Drag (Instant Area / Stroke)
    if (isErasingRef.current) {
      const world = screenToWorld(e.clientX, e.clientY);
      handleContinuousEraser(world);
      return;
    }

    if (!isDrawingRef.current) return;

    // Coalesced high-frequency hardware events for stylus/digitizer accuracy
    const nativeEvent = e.nativeEvent as any;
    const rawEvents: PointerEvent[] =
      typeof nativeEvent.getCoalescedEvents === 'function'
        ? nativeEvent.getCoalescedEvents()
        : [e.nativeEvent];

    const isMouse = e.pointerType === 'mouse';
    let addedAny = false;

    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      const world = screenToWorld(ev.clientX, ev.clientY);

      const pt: Point = {
        x: world.x,
        y: world.y,
        pressure: isMouse ? 0.5 : (ev.pressure && ev.pressure > 0 ? ev.pressure : 0.5),
        timestamp: Date.now()
      };
      currentPointsRef.current.push(pt);
      addedAny = true;
    }

    if (addedAny) {
      renderActiveCanvasContent();
    }
  };

  // Pointer Up handler: commit element (NEVER falsely detect shape on release!)
  const handlePointerUp = () => {
    isPanningRef.current = false;
    if (isDraggingSelectionRef.current) {
      isDraggingSelectionRef.current = false;
      return;
    }

    // Finalize active eraser drag: atomic commit to store with undo history
    if (isErasingRef.current) {
      isErasingRef.current = false;
      lastEraserPosRef.current = null;
      if (eraserModifiedRef.current && onReplaceStrokes) {
        const finalErasedStrokes = [...workingStrokesRef.current];
        onReplaceStrokes(finalErasedStrokes);
      }
      eraserModifiedRef.current = false;
      requestMainRender();
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // 1. Commit raw hand-drawn vector points directly
    const rawPoints = [...currentPointsRef.current];
    clearActiveCanvas();
    if (rawPoints.length === 0) return;

    if (tools.activeTool === 'pen') {
      onAddStroke({
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        points: rawPoints,
        color: tools.pen.color,
        width: tools.pen.width,
        tool: tools.pen.preset,
        lineType: tools.pen.lineType || 'pressure-variable'
      });

      let maxY = -Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        if (p.y > maxY) maxY = p.y;
        if (p.x > maxX) maxX = p.x;
      }
      handleContentPageCheck(maxY, maxX);
    } else if (tools.activeTool === 'highlighter') {
      onAddStroke({
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        points: rawPoints,
        color: tools.highlighter.color,
        width: tools.highlighter.width,
        tool: 'marker',
        isHighlighter: true,
        opacity: tools.highlighter.opacity
      });
    }
 else if (tools.activeTool === 'shapes') {
      const start = rawPoints[0];
      const end = rawPoints[rawPoints.length - 1];

      onAddShape({
        id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: tools.shapes.shape,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        color: tools.shapes.color,
        width: tools.shapes.width,
        lineType: 'uniform',
        fill: tools.shapes.fill
      });
    } else if (tools.activeTool === 'lasso') {
      if (rawPoints.length >= 3) {
        const selectedStrokes: string[] = [];
        const selectedShapes: string[] = [];

        for (let i = 0; i < doc.content.strokes.length; i++) {
          const stroke = doc.content.strokes[i];
          let inCount = 0;
          for (let j = 0; j < stroke.points.length; j++) {
            if (isPointInPolygon(stroke.points[j], rawPoints)) inCount++;
          }
          if (inCount > stroke.points.length * 0.4) {
            selectedStrokes.push(stroke.id);
          }
        }

        for (let i = 0; i < doc.content.shapes.length; i++) {
          const sh = doc.content.shapes[i];
          const center = {
            x: (sh.startX + sh.endX) / 2,
            y: (sh.startY + sh.endY) / 2
          };
          if (isPointInPolygon(center, rawPoints)) {
            selectedShapes.push(sh.id);
          }
        }

        if (selectedStrokes.length > 0 || selectedShapes.length > 0) {
          const allPoints: Point[] = [];
          for (let i = 0; i < doc.content.strokes.length; i++) {
            const s = doc.content.strokes[i];
            if (selectedStrokes.includes(s.id)) {
              allPoints.push(...s.points);
            }
          }
          for (let i = 0; i < doc.content.shapes.length; i++) {
            const sh = doc.content.shapes[i];
            if (selectedShapes.includes(sh.id)) {
              allPoints.push({ x: sh.startX, y: sh.startY });
              allPoints.push({ x: sh.endX, y: sh.endY });
            }
          }
          const bounds = getPointsBounds(allPoints);
          onSetLassoSelection({
            selectedStrokeIds: selectedStrokes,
            selectedShapeIds: selectedShapes,
            selectedImageIds: [],
            bounds
          });
        } else {
          onSetLassoSelection({
            selectedStrokeIds: [],
            selectedShapeIds: [],
            selectedImageIds: [],
            bounds: null
          });
        }
      }
    }

    currentPointsRef.current = [];
    requestMainRender();
  };

  // Wheel zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      onUpdateViewport((prev) => {
        const nextZoom = Math.max(0.2, Math.min(4.0, prev.zoom * zoomFactor));
        return {
          zoom: nextZoom,
          panX: mouseX - (mouseX - prev.panX) * (nextZoom / prev.zoom),
          panY: mouseY - (mouseY - prev.panY) * (nextZoom / prev.zoom)
        };
      });
    } else {
      const nextPanX = viewport.panX - e.deltaX;
      const nextPanY = viewport.panY - e.deltaY;
      onUpdateViewport((prev) => ({
        ...prev,
        panX: nextPanX,
        panY: nextPanY
      }));
      handleScrollPageCheck(nextPanX, nextPanY);
    }
  };

  // Touch gesture pinch to zoom & pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStartDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / touchStartDistRef.current;

      onUpdateViewport((prev) => ({
        ...prev,
        zoom: Math.max(0.2, Math.min(4.0, prev.zoom * factor))
      }));
      touchStartDistRef.current = dist;
    }
  };

  const handleTextFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Calculate dynamic cursor preview dimensions
  const isBrushTool =
    tools.activeTool === 'pen' ||
    tools.activeTool === 'highlighter' ||
    tools.activeTool === 'eraser';

  let cursorDiameter = 16;
  if (tools.activeTool === 'pen') {
    cursorDiameter = Math.max(5, tools.pen.width * viewport.zoom);
  } else if (tools.activeTool === 'highlighter') {
    cursorDiameter = Math.max(8, tools.highlighter.width * viewport.zoom);
  } else if (tools.activeTool === 'eraser') {
    cursorDiameter = Math.max(10, tools.eraser.size * viewport.zoom);
  }

  const pageDims = PageEngine.getPageDimensions(doc.settings.page.orientation);
  const isSplit = doc.settings.mode === 'split-pages';
  const gap = isSplit ? PAGE_GAP_SPLIT : PAGE_GAP_SCROLL;
  const totalDocHeight =
    doc.settings.scrollDirection === 'horizontal'
      ? pageDims.height
      : doc.content.pageCount * pageDims.height + (doc.content.pageCount - 1) * gap;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => {
        if (cursorRef.current && isBrushTool) {
          cursorRef.current.style.opacity = '1';
        }
      }}
      onPointerLeave={() => {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '0';
        }
        if (isDrawingRef.current) {
          handlePointerUp();
        }
      }}
      className={`relative h-full w-full overflow-hidden bg-[#121110] select-none ${
        isBrushTool
          ? 'cursor-none'
          : tools.activeTool === 'lasso'
          ? 'cursor-crosshair'
          : tools.activeTool === 'text'
          ? 'cursor-text'
          : 'cursor-default'
      }`}
    >
      {/* Rich Text Formatting Toolbar when in text/keyboard mode */}
      {tools.activeTool === 'text' && (
        <div className="absolute top-0 left-0 right-0 z-40">
          <TextToolbar
            onFormat={handleTextFormat}
            activeFormats={{
              bold: false,
              italic: false,
              underline: false,
              strike: false,
              align: 'left',
              fontFamily: 'Lora',
              fontSize: '16px'
            }}
          />
        </div>
      )}

      {/* 1. Main Static Canvas (Background, Templates, Committed Strokes) */}
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 block h-full w-full pointer-events-none"
      />

      {/* 2. Active Scratch Canvas (Hardware-accelerated Zero-Latency Active Stroke) */}
      <canvas
        ref={activeCanvasRef}
        className="absolute inset-0 block h-full w-full pointer-events-none"
      />

      {/* 3. Dynamic Responsive Brush & Eraser Size Preview Cursor */}
      {isBrushTool && (
        <div
          ref={cursorRef}
          className="pointer-events-none absolute left-0 top-0 z-50 transition-opacity duration-75 will-change-transform"
          style={{
            opacity: 0,
            transform: 'translate3d(-500px, -500px, 0)'
          }}
        >
          {tools.activeTool === 'eraser' ? (
            tools.eraser.type === 'stroke' ? (
              // Stroke Eraser Cursor: crimson ring with crosshair center dot
              <div
                style={{
                  width: `${cursorDiameter}px`,
                  height: `${cursorDiameter}px`
                }}
                className="relative flex items-center justify-center rounded-full border border-dashed border-[#f43f5e] bg-[#f43f5e]/15 shadow-[0_0_2px_rgba(0,0,0,0.8)]"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#f43f5e] shadow-sm" />
              </div>
            ) : (
              // Area/Pixel Eraser Cursor: crisp solid boundary with subtle translucent mask fill
              <div
                style={{
                  width: `${cursorDiameter}px`,
                  height: `${cursorDiameter}px`
                }}
                className="relative flex items-center justify-center rounded-full border border-white/85 bg-white/15 shadow-[0_0_0_1px_rgba(0,0,0,0.7),inset_0_0_4px_rgba(255,255,255,0.2)]"
              >
                <div className="h-1 w-1 rounded-full bg-white/90 shadow-sm" />
              </div>
            )
          ) : tools.activeTool === 'highlighter' ? (
            // Highlighter Cursor: tinted translucent disk matching width and hue
            <div
              style={{
                width: `${cursorDiameter}px`,
                height: `${cursorDiameter}px`,
                borderColor: tools.highlighter.color,
                backgroundColor: tools.highlighter.color
              }}
              className="relative flex items-center justify-center rounded-full border border-white/70 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
            >
              <div
                className="h-full w-full rounded-full"
                style={{
                  backgroundColor: tools.highlighter.color,
                  opacity: Math.max(0.3, tools.highlighter.opacity * 0.5)
                }}
              />
            </div>
          ) : (
            // Pen Tool Cursor: exact circular footprint with active color preview
            <div
              style={{
                width: `${cursorDiameter}px`,
                height: `${cursorDiameter}px`
              }}
              className="relative flex items-center justify-center rounded-full border border-white/90 shadow-[0_0_2px_rgba(0,0,0,0.9),inset_0_0_1px_rgba(0,0,0,0.4)]"
            >
              <div
                className="rounded-full"
                style={{
                  width: `${Math.min(cursorDiameter, Math.max(3, cursorDiameter * 0.6))}px`,
                  height: `${Math.min(cursorDiameter, Math.max(3, cursorDiameter * 0.6))}px`,
                  backgroundColor: tools.pen.color
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Embedded Rich-Text Continuous Document Flow */}
      <div
        className="absolute pointer-events-auto"
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          left: 0,
          top: 0
        }}
      >
        <RichTextDocument
          html={doc.content.textHtml}
          onChange={onUpdateText}
          width={pageDims.width}
          minHeight={totalDocHeight}
          backgroundColor={doc.settings.page.backgroundColor}
          isEditable={tools.activeTool === 'text'}
          onHeightChange={(h) => handleContentPageCheck(h, pageDims.width)}
        />
      </div>

      {/* Floating Lasso Selection Bar */}
      {tools.lasso.bounds && (
        <LassoFloatingBar
          bounds={tools.lasso.bounds}
          onDuplicate={onDuplicateSelection}
          onDelete={onDeleteSelection}
          onDeselect={() =>
            onSetLassoSelection({
              selectedStrokeIds: [],
              selectedShapeIds: [],
              selectedImageIds: [],
              bounds: null
            })
          }
          screenPos={lassoScreenPos}
        />
      )}
    </div>
  );
};
