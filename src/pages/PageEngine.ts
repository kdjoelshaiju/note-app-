import { PageOrientation, DocumentMode, ScrollDirection, PageSettings } from '../types/document';

export const A4_PORTRAIT_WIDTH = 794;
export const A4_PORTRAIT_HEIGHT = 1123;
export const PAGE_GAP_SPLIT = 36;
export const PAGE_GAP_SCROLL = 0;

export interface PageBounds {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PageEngine {
  static getPageDimensions(orientation: PageOrientation): { width: number; height: number } {
    if (orientation === 'landscape') {
      return { width: A4_PORTRAIT_HEIGHT, height: A4_PORTRAIT_WIDTH };
    }
    return { width: A4_PORTRAIT_WIDTH, height: A4_PORTRAIT_HEIGHT };
  }

  static getPageBounds(
    pageIndex: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): PageBounds {
    const { width, height } = this.getPageDimensions(settings.orientation);
    const gap = settings.mode === 'split-pages' ? PAGE_GAP_SPLIT : PAGE_GAP_SCROLL;

    if (settings.mode === 'infinite-canvas') {
      // In infinite canvas, page 0 represents default center sheet bounds if needed,
      // but canvas is unrestricted.
      return {
        pageIndex,
        x: 0,
        y: 0,
        width,
        height
      };
    }

    if (settings.scrollDirection === 'horizontal') {
      return {
        pageIndex,
        x: pageIndex * (width + gap),
        y: 0,
        width,
        height
      };
    }

    // Default vertical scroll
    return {
      pageIndex,
      x: 0,
      y: pageIndex * (height + gap),
      width,
      height
    };
  }

  static getAllPageBounds(
    pageCount: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): PageBounds[] {
    const list: PageBounds[] = [];
    const count = Math.max(1, pageCount);
    for (let i = 0; i < count; i++) {
      list.push(this.getPageBounds(i, settings));
    }
    return list;
  }

  /**
   * Calculates which page an (x, y) coordinate falls into, or if it triggers a new page
   */
  static getPageForPoint(
    point: { x: number; y: number },
    pageCount: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): number {
    if (settings.mode === 'infinite-canvas') return 0;

    const { width, height } = this.getPageDimensions(settings.orientation);
    const gap = settings.mode === 'split-pages' ? PAGE_GAP_SPLIT : PAGE_GAP_SCROLL;

    if (settings.scrollDirection === 'horizontal') {
      const step = width + gap;
      return Math.max(0, Math.floor(point.x / step));
    }

    const step = height + gap;
    return Math.max(0, Math.floor(point.y / step));
  }

  /**
   * Determine required page count based on elements bottom/right extents
   */
  static calculateRequiredPages(
    maxExtentY: number,
    maxExtentX: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): number {
    if (settings.mode === 'infinite-canvas') return 1;

    const { width, height } = this.getPageDimensions(settings.orientation);
    const gap = settings.mode === 'split-pages' ? PAGE_GAP_SPLIT : PAGE_GAP_SCROLL;

    if (settings.scrollDirection === 'horizontal') {
      const step = width + gap;
      const count = Math.ceil((maxExtentX + 150) / step);
      return Math.max(1, count);
    }

    const step = height + gap;
    const count = Math.ceil((maxExtentY + 150) / step);
    return Math.max(1, count);
  }
}
