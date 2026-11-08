import { getStroke } from 'perfect-freehand';
import { InkStroke, LineType, PenToolType, Point } from '../types/document';
import { distance } from '../utils/geometry';

export class StrokeRenderer {
  /**
   * Helper: calculate cumulative distances along a polyline
   */
  private static getCumulativeDistances(points: Point[]): number[] {
    const dists: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      dists.push(dists[i - 1] + distance(points[i - 1], points[i]));
    }
    return dists;
  }

  /**
   * Helper: interpolate point along polyline at exact distance d
   */
  private static getPointAtDistance(
    points: Point[],
    dists: number[],
    d: number
  ): { x: number; y: number; pressure: number } {
    if (d <= 0 || points.length === 1) {
      return { x: points[0].x, y: points[0].y, pressure: points[0].pressure ?? 0.5 };
    }
    const totalDist = dists[dists.length - 1];
    if (d >= totalDist) {
      const last = points[points.length - 1];
      return { x: last.x, y: last.y, pressure: last.pressure ?? 0.5 };
    }

    // Binary search for segment
    let low = 0;
    let high = dists.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (dists[mid] <= d && dists[mid + 1] >= d) {
        const segDist = dists[mid + 1] - dists[mid];
        const t = segDist === 0 ? 0 : (d - dists[mid]) / segDist;
        const p1 = points[mid];
        const p2 = points[mid + 1];
        return {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          pressure: (p1.pressure ?? 0.5) + ((p2.pressure ?? 0.5) - (p1.pressure ?? 0.5)) * t
        };
      } else if (dists[mid] < d) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const last = points[points.length - 1];
    return { x: last.x, y: last.y, pressure: last.pressure ?? 0.5 };
  }

  /**
   * Returns stroke outline points using perfect-freehand for variable-width strokes
   */
  static getStrokeOutline(stroke: InkStroke): number[][] {
    const rawPoints = stroke.points.map((p) => [p.x, p.y, p.pressure ?? 0.5]);
    if (rawPoints.length === 0) return [];

    let options: Parameters<typeof getStroke>[1];

    if (stroke.isHighlighter) {
      options = {
        size: stroke.width,
        thinning: 0,
        smoothing: 0.1,
        streamline: 0.02,
        simulatePressure: false,
        start: { taper: 0, cap: true },
        end: { taper: 0, cap: true }
      };
    } else {
      switch (stroke.tool) {
        case 'fountain':
          options = {
            size: stroke.width,
            thinning: 0.5,
            smoothing: 0.15,
            streamline: 0.02,
            simulatePressure: false,
            start: { taper: stroke.width * 1.0, cap: true },
            end: { taper: stroke.width * 0.8, cap: true }
          };
          break;

        case 'ballpoint':
          options = {
            size: stroke.width,
            thinning: 0.15,
            smoothing: 0.1,
            streamline: 0.01,
            simulatePressure: false,
            start: { taper: 0, cap: true },
            end: { taper: 0, cap: true }
          };
          break;

        case 'marker':
          options = {
            size: stroke.width * 1.3,
            thinning: 0.05,
            smoothing: 0.15,
            streamline: 0.02,
            simulatePressure: false,
            start: { taper: 0, cap: true },
            end: { taper: 0, cap: true }
          };
          break;

        case 'pencil':
          options = {
            size: stroke.width,
            thinning: 0.3,
            smoothing: 0.1,
            streamline: 0.01,
            simulatePressure: false,
            start: { taper: stroke.width * 0.3, cap: true },
            end: { taper: stroke.width * 0.3, cap: true }
          };
          break;

        case 'brush':
        default:
          options = {
            size: stroke.width * 1.5,
            thinning: 0.7,
            smoothing: 0.15,
            streamline: 0.02,
            simulatePressure: false,
            start: { taper: stroke.width * 1.2, cap: true },
            end: { taper: stroke.width * 1.0, cap: true }
          };
          break;
      }
    }

    return getStroke(rawPoints, options);
  }

  /**
   * Main Render function for all four line types across all five pen presets
   */
  static drawStroke(ctx: CanvasRenderingContext2D, stroke: InkStroke) {
    if (!stroke.points || stroke.points.length === 0) return;

    const lineType: LineType = stroke.lineType || (stroke.isHighlighter ? 'uniform' : 'pressure-variable');

    ctx.save();

    // Material characteristics per pen
    if (stroke.isHighlighter) {
      ctx.globalAlpha = stroke.opacity ?? 0.35;
      ctx.fillStyle = stroke.color;
      ctx.strokeStyle = stroke.color;
    } else if (stroke.tool === 'pencil') {
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = stroke.color;
      ctx.strokeStyle = stroke.color;
    } else {
      ctx.globalAlpha = stroke.opacity ?? 1.0;
      ctx.fillStyle = stroke.color;
      ctx.strokeStyle = stroke.color;
    }

    switch (lineType) {
      case 'uniform': {
        // Type 1: Same Width (constant thickness throughout)
        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.lineWidth = stroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            // Smooth curve with quadratic midpoint
            const midX = (pts[i - 1].x + pts[i].x) / 2;
            const midY = (pts[i - 1].y + pts[i].y) / 2;
            ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, midX, midY);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
        break;
      }

      case 'pressure-variable': {
        // Type 2: Variable Width (pressure sensitive via perfect-freehand)
        const outline = this.getStrokeOutline(stroke);
        if (outline.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(outline[0][0], outline[0][1]);
          for (let i = 1; i < outline.length; i++) {
            ctx.lineTo(outline[i][0], outline[i][1]);
          }
          ctx.closePath();
          ctx.fill();
        } else if (stroke.points.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (stroke.points.length >= 2) {
          ctx.lineWidth = stroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            const midX = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
            const midY = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
            ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, midX, midY);
          }
          ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
          ctx.stroke();
        }
        break;
      }

      case 'dotted': {
        // Type 3: Dotted along distance path
        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        const dists = this.getCumulativeDistances(pts);
        const totalDist = dists[dists.length - 1];
        const dotRadius = Math.max(1, stroke.width / 2);
        const spacing = Math.max(dotRadius * 2.6, 6);

        let curD = 0;
        while (curD <= totalDist) {
          const pt = this.getPointAtDistance(pts, dists, curD);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          curD += spacing;
        }
        break;
      }

      case 'dashed': {
        // Type 4: Dashed along distance path
        const pts = stroke.points;
        if (pts.length < 2) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        const dashLen = Math.max(8, stroke.width * 3.5);
        const gapLen = Math.max(6, stroke.width * 2.2);

        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([dashLen, gapLen]);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const midX = (pts[i - 1].x + pts[i].x) / 2;
          const midY = (pts[i - 1].y + pts[i].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, midX, midY);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Convert outline to SVG path string for exports
   */
  static getSvgPathFromStroke(stroke: InkStroke): string {
    const outline = this.getStrokeOutline(stroke);
    if (outline.length < 2) return '';

    let d = `M ${outline[0][0].toFixed(2)} ${outline[0][1].toFixed(2)}`;
    for (let i = 1; i < outline.length; i++) {
      d += ` L ${outline[i][0].toFixed(2)} ${outline[i][1].toFixed(2)}`;
    }
    d += ' Z';
    return d;
  }
}
