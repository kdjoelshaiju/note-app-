import { InkStroke, ShapeItem, Point } from '../types/document';
import { distanceToSegment } from '../utils/geometry';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface IndexedStroke {
  id: string;
  stroke: InkStroke;
  bbox: BoundingBox;
}

export class StrokeSpatialIndex {
  private indexedStrokes: Map<string, IndexedStroke> = new Map();

  public static computeBoundingBox(points: Point[], extraPadding = 10): BoundingBox {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      minX: minX - extraPadding,
      minY: minY - extraPadding,
      maxX: maxX + extraPadding,
      maxY: maxY + extraPadding
    };
  }

  public static intersectsBox(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.maxX < b.minX ||
      a.minX > b.maxX ||
      a.maxY < b.minY ||
      a.minY > b.maxY
    );
  }

  public sync(strokes: InkStroke[]) {
    const currentIds = new Set<string>();

    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      currentIds.add(stroke.id);

      if (!this.indexedStrokes.has(stroke.id)) {
        this.indexedStrokes.set(stroke.id, {
          id: stroke.id,
          stroke,
          bbox: StrokeSpatialIndex.computeBoundingBox(stroke.points, stroke.width + 8)
        });
      }
    }

    // Clean up deleted strokes
    for (const id of this.indexedStrokes.keys()) {
      if (!currentIds.has(id)) {
        this.indexedStrokes.delete(id);
      }
    }
  }

  /**
   * Fast spatial query: find all stroke IDs that intersect a circular eraser area
   */
  public queryIntersectingStrokes(center: { x: number; y: number }, radius: number): string[] {
    const eraserBox: BoundingBox = {
      minX: center.x - radius,
      minY: center.y - radius,
      maxX: center.x + radius,
      maxY: center.y + radius
    };

    const hits: string[] = [];
    const rSquared = radius * radius;

    for (const item of this.indexedStrokes.values()) {
      // 1. Fast AABB rejection
      if (!StrokeSpatialIndex.intersectsBox(item.bbox, eraserBox)) {
        continue;
      }

      // 2. Precise segment check only for candidates
      const pts = item.stroke.points;
      let intersected = false;

      // Sample check or segment distance
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distanceToSegment(center, pts[i], pts[i + 1]);
        if (d <= radius + (item.stroke.width / 2)) {
          intersected = true;
          break;
        }
      }

      // Check single point strokes
      if (!intersected && pts.length === 1) {
        const dx = pts[0].x - center.x;
        const dy = pts[0].y - center.y;
        if (dx * dx + dy * dy <= rSquared) {
          intersected = true;
        }
      }

      if (intersected) {
        hits.push(item.id);
      }
    }

    return hits;
  }
}
