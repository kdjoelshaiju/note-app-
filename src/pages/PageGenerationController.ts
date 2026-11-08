import { DocumentMode, PageOrientation, ScrollDirection } from '../types/document';
import { PageEngine } from './PageEngine';

export interface PageGenerationState {
  lastGeneratedPage: number;
  generationInProgress: boolean;
  lastTriggerPage: number | null;
}

export class PageGenerationController {
  private state: PageGenerationState = {
    lastGeneratedPage: 0,
    generationInProgress: false,
    lastTriggerPage: null
  };

  private currentDocId: string = '';

  constructor(docId: string = '') {
    this.currentDocId = docId;
  }

  public reset(docId: string, initialPageCount: number) {
    this.currentDocId = docId;
    this.state = {
      lastGeneratedPage: Math.max(0, initialPageCount - 1),
      generationInProgress: false,
      lastTriggerPage: null
    };
  }

  /**
   * Checks whether scrolling should trigger exactly one page generation
   */
  public checkScrollTrigger(
    viewport: { panX: number; panY: number; zoom: number },
    container: { width: number; height: number },
    currentPageCount: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): boolean {
    if (settings.mode === 'infinite-canvas') return false;
    if (this.state.generationInProgress) return false;

    const lastPageIndex = Math.max(0, currentPageCount - 1);

    // If we already triggered for this page, do not trigger again until re-armed
    if (this.state.lastTriggerPage === lastPageIndex) {
      return false;
    }

    const bounds = PageEngine.getPageBounds(lastPageIndex, settings);

    if (settings.scrollDirection === 'horizontal') {
      const visibleRightX = (container.width - viewport.panX) / viewport.zoom;
      // Trigger when visible right edge is within 150px of last page's right edge
      const threshold = bounds.x + bounds.width - 150;
      if (visibleRightX >= threshold) {
        this.state.generationInProgress = true;
        this.state.lastTriggerPage = lastPageIndex;
        this.state.lastGeneratedPage = lastPageIndex + 1;
        return true;
      }
    } else {
      const visibleBottomY = (container.height - viewport.panY) / viewport.zoom;
      // Trigger when visible bottom edge is within 150px of last page's bottom edge
      const threshold = bounds.y + bounds.height - 150;
      if (visibleBottomY >= threshold) {
        this.state.generationInProgress = true;
        this.state.lastTriggerPage = lastPageIndex;
        this.state.lastGeneratedPage = lastPageIndex + 1;
        return true;
      }
    }

    return false;
  }

  /**
   * Checks whether drawing or typed content near the bottom of the final page requires a new page
   */
  public checkContentTrigger(
    contentMaxY: number,
    contentMaxX: number,
    currentPageCount: number,
    settings: {
      mode: DocumentMode;
      scrollDirection: ScrollDirection;
      orientation: PageOrientation;
    }
  ): boolean {
    if (settings.mode === 'infinite-canvas') return false;
    if (this.state.generationInProgress) return false;

    const lastPageIndex = Math.max(0, currentPageCount - 1);
    if (this.state.lastTriggerPage === lastPageIndex) {
      return false;
    }

    const bounds = PageEngine.getPageBounds(lastPageIndex, settings);

    if (settings.scrollDirection === 'horizontal') {
      // If content reaches within 80px of page right
      if (contentMaxX >= bounds.x + bounds.width - 80) {
        this.state.generationInProgress = true;
        this.state.lastTriggerPage = lastPageIndex;
        this.state.lastGeneratedPage = lastPageIndex + 1;
        return true;
      }
    } else {
      // If content reaches within 80px of page bottom
      if (contentMaxY >= bounds.y + bounds.height - 80) {
        this.state.generationInProgress = true;
        this.state.lastTriggerPage = lastPageIndex;
        this.state.lastGeneratedPage = lastPageIndex + 1;
        return true;
      }
    }

    return false;
  }

  public completeGeneration() {
    this.state.generationInProgress = false;
  }

  public getState(): PageGenerationState {
    return { ...this.state };
  }
}
