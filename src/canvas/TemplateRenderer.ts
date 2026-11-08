import { TemplateConfig, PaperColor } from '../types/document';

export class TemplateRenderer {
  /**
   * Returns contrasting line and dot color based on paper color
   */
  static getRulingColors(backgroundColor: PaperColor): { line: string; margin: string; dot: string } {
    switch (backgroundColor) {
      case '#ffffff':
      case '#fbfbf8':
      case '#f2f1ee':
        return {
          line: 'rgba(26, 25, 24, 0.11)',
          margin: 'rgba(180, 50, 50, 0.35)', // Classic vintage red margin rule
          dot: 'rgba(26, 25, 24, 0.22)'
        };
      case '#d6d4ce':
        return {
          line: 'rgba(26, 25, 24, 0.18)',
          margin: 'rgba(180, 40, 40, 0.45)',
          dot: 'rgba(26, 25, 24, 0.28)'
        };
      case '#292827':
      case '#141312':
      default:
        return {
          line: 'rgba(255, 255, 255, 0.12)',
          margin: 'rgba(230, 100, 100, 0.35)',
          dot: 'rgba(255, 255, 255, 0.25)'
        };
    }
  }

  /**
   * Renders the template pattern onto a canvas context within the given bounds
   */
  static renderTemplate(
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number },
    template: TemplateConfig,
    backgroundColor: PaperColor,
    customImage?: HTMLImageElement | null
  ) {
    const { x, y, width, height } = bounds;
    const colors = this.getRulingColors(backgroundColor);

    ctx.save();
    // Clip to page bounds to guarantee clean edges
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    if (template.type === 'custom' && customImage && customImage.complete) {
      try {
        ctx.drawImage(customImage, x, y, width, height);
      } catch (e) {
        console.warn('Failed to draw custom template image', e);
      }
      ctx.restore();
      return;
    }

    if (template.type === 'blank') {
      ctx.restore();
      return;
    }

    ctx.lineWidth = 1;

    if (template.type === 'lined' || template.type === 'oxford') {
      const step = template.variation === 'narrow' ? 19 : template.variation === 'wide' ? 34 : 26.5;
      const topMargin = step * 2;
      const bottomMargin = height - step;

      ctx.strokeStyle = colors.line;
      ctx.beginPath();
      for (let curY = y + topMargin; curY <= y + bottomMargin; curY += step) {
        ctx.moveTo(x + 20, Math.floor(curY) + 0.5);
        ctx.lineTo(x + width - 20, Math.floor(curY) + 0.5);
      }
      ctx.stroke();

      // Oxford vertical margin line
      if (template.type === 'oxford') {
        const marginX = x + 110;
        ctx.strokeStyle = colors.margin;
        ctx.beginPath();
        ctx.moveTo(Math.floor(marginX) + 0.5, y + 10);
        ctx.lineTo(Math.floor(marginX) + 0.5, y + height - 10);
        ctx.stroke();
      }
    } else if (template.type === 'grid') {
      const step = template.variation === 'narrow' ? 11.5 : template.variation === 'wide' ? 30 : 19;
      ctx.strokeStyle = colors.line;
      ctx.beginPath();

      // Vertical lines
      for (let curX = x; curX <= x + width; curX += step) {
        ctx.moveTo(Math.floor(curX) + 0.5, y);
        ctx.lineTo(Math.floor(curX) + 0.5, y + height);
      }

      // Horizontal lines
      for (let curY = y; curY <= y + height; curY += step) {
        ctx.moveTo(x, Math.floor(curY) + 0.5);
        ctx.lineTo(x + width, Math.floor(curY) + 0.5);
      }
      ctx.stroke();
    } else if (template.type === 'dot') {
      const step = template.variation === 'narrow' ? 11.5 : template.variation === 'wide' ? 30 : 19;
      ctx.fillStyle = colors.dot;
      const dotRadius = 1;

      for (let curX = x + step; curX < x + width; curX += step) {
        for (let curY = y + step; curY < y + height; curY += step) {
          ctx.beginPath();
          ctx.arc(curX, curY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Infinite Canvas Procedural Grid/Lined/Dot Background
   * Renders only within the currently visible viewport tile area, aligned to world 0,0!
   */
  static renderInfiniteCanvasBackground(
    ctx: CanvasRenderingContext2D,
    viewport: { x: number; y: number; width: number; height: number },
    template: TemplateConfig,
    backgroundColor: PaperColor
  ) {
    if (template.type === 'blank') return;
    const colors = this.getRulingColors(backgroundColor);

    let step = 26.5;
    if (template.type === 'grid' || template.type === 'dot') {
      step = template.variation === 'narrow' ? 11.5 : template.variation === 'wide' ? 30 : 19;
    } else if (template.type === 'lined' || template.type === 'oxford') {
      step = template.variation === 'narrow' ? 19 : template.variation === 'wide' ? 34 : 26.5;
    }

    // Align to world grid
    const startX = Math.floor(viewport.x / step) * step;
    const endX = Math.ceil((viewport.x + viewport.width) / step) * step;
    const startY = Math.floor(viewport.y / step) * step;
    const endY = Math.ceil((viewport.y + viewport.height) / step) * step;

    ctx.save();

    if (template.type === 'lined' || template.type === 'oxford') {
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let curY = startY; curY <= endY; curY += step) {
        ctx.moveTo(viewport.x, Math.floor(curY) + 0.5);
        ctx.lineTo(viewport.x + viewport.width, Math.floor(curY) + 0.5);
      }
      ctx.stroke();

      if (template.type === 'oxford') {
        // Repeated Oxford red margin every A4 width (794px)
        const pageW = 794;
        const pageStartX = Math.floor(viewport.x / pageW) * pageW;
        ctx.strokeStyle = colors.margin;
        ctx.beginPath();
        for (let pX = pageStartX; pX <= endX; pX += pageW) {
          const marginX = pX + 110;
          ctx.moveTo(Math.floor(marginX) + 0.5, viewport.y);
          ctx.lineTo(Math.floor(marginX) + 0.5, viewport.y + viewport.height);
        }
        ctx.stroke();
      }
    } else if (template.type === 'grid') {
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let curX = startX; curX <= endX; curX += step) {
        ctx.moveTo(Math.floor(curX) + 0.5, viewport.y);
        ctx.lineTo(Math.floor(curX) + 0.5, viewport.y + viewport.height);
      }
      for (let curY = startY; curY <= endY; curY += step) {
        ctx.moveTo(viewport.x, Math.floor(curY) + 0.5);
        ctx.lineTo(viewport.x + viewport.width, Math.floor(curY) + 0.5);
      }
      ctx.stroke();
    } else if (template.type === 'dot') {
      ctx.fillStyle = colors.dot;
      const dotRadius = 1;
      for (let curX = startX; curX <= endX; curX += step) {
        for (let curY = startY; curY <= endY; curY += step) {
          ctx.beginPath();
          ctx.arc(curX, curY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }
}
