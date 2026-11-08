export type DocumentMode = 'split-pages' | 'infinite-scroll' | 'infinite-canvas';

export type PageOrientation = 'portrait' | 'landscape';

export type ScrollDirection = 'vertical' | 'horizontal';

export type PageSize = 'A4';

export type TemplateType = 'lined' | 'grid' | 'dot' | 'oxford' | 'blank' | 'custom';

export type TemplateVariation = 'standard' | 'narrow' | 'wide';

export interface TemplateConfig {
  type: TemplateType;
  variation?: TemplateVariation;
  customAssetId?: string;
  customImageData?: string;
}

export type PaperColor = 
  | '#ffffff' // Pure white
  | '#fbfbf8' // Off-white / Cream
  | '#f2f1ee' // Light grey
  | '#d6d4ce' // Medium grey
  | '#292827' // Dark charcoal
  | '#141312'; // Black

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  backgroundColor: PaperColor;
  template: TemplateConfig;
}

export interface DocumentSettings {
  mode: DocumentMode;
  scrollDirection: ScrollDirection;
  page: PageSettings;
}

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export type PenToolType = 'fountain' | 'ballpoint' | 'marker' | 'pencil' | 'brush';

export type LineType = 'uniform' | 'pressure-variable' | 'dotted' | 'dashed';

export interface InkStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: PenToolType;
  lineType?: LineType;
  opacity?: number;
  isHighlighter?: boolean;
  pageIndex?: number; // Calculated or assigned page
  straightened?: boolean;
}

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'rounded-rectangle' | 'circle' | 'triangle' | 'polygon';

export interface ShapeItem {
  id: string;
  type: ShapeType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
  lineType?: LineType;
  fill?: 'none' | 'solid' | 'transparent';
  fillColor?: string;
  pageIndex?: number;
}

export interface ImageItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  pageIndex?: number;
}

export interface TextBlockItem {
  id: string;
  content: string; // HTML rich text
  x: number;
  y: number;
  width: number;
  height?: number;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface DocumentContent {
  strokes: InkStroke[];
  shapes: ShapeItem[];
  images: ImageItem[];
  textHtml: string; // Unified continuous document flow HTML
  pageCount: number; // Dynamically expands as user writes/types
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
}

export interface NotebookDocument {
  id: string;
  title: string;
  settings: DocumentSettings;
  content: DocumentContent;
  createdAt: number;
  updatedAt: number;
  folderId?: string;
  isDeleted?: boolean;
}

export type ActiveTool = 
  | 'text'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'shapes';

export type EraserType = 'stroke' | 'area';

export interface ToolSettings {
  activeTool: ActiveTool;
  activePopover: ActiveTool | null;
  pen: {
    preset: PenToolType;
    lineType: LineType;
    width: number;
    color: string;
    straightenLines: boolean;
    shapeRecognition: boolean;
    recentColors: string[];
  };
  highlighter: {
    width: number;
    color: string;
    opacity: number;
    straightenLines: boolean;
    shapeRecognition: boolean;
  };
  eraser: {
    type: EraserType;
    size: number;
  };
  shapes: {
    shape: ShapeType;
    width: number;
    color: string;
    fill: 'none' | 'solid' | 'transparent';
    recognition: boolean;
  };
  lasso: {
    selectedStrokeIds: string[];
    selectedShapeIds: string[];
    selectedImageIds: string[];
    bounds: { x: number; y: number; width: number; height: number } | null;
  };
}

export interface ViewportState {
  zoom: number; // 0.2 to 5.0 (1.0 = 100%)
  panX: number;
  panY: number;
}
