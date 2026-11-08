import { InkStroke, Point } from '../types/document';
import { distance, distanceToSegment } from '../utils/geometry';
import { StrokeSpatialIndex, BoundingBox } from './SpatialIndex';

/**
 * Calculates intersection parameter t in [0, 1] of segment (p1, p2) with circle (center, radius).
 * Returns array of t values in ascending order [0, 1].
 */
function getSegmentCircleIntersections(
  p1: Point,
  p2: Point,
  center: { x: number; y: number },
  radius: number
): number[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const vx = p1.x - center.x;
  const vy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  if (a < 1e-6) return [];

  const b = 2 * (vx * dx + vy * dy);
  const c = vx * vx + vy * vy - radius * radius;

  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];

  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  const roots: number[] = [];
  if (t1 >= 0 && t1 <= 1) roots.push(t1);
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-4) roots.push(t2);

  return roots.sort((x, y) => x - y);
}

function interpolatePoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
    pressure: (p1.pressure ?? 0.5) + ((p2.pressure ?? 0.5) - (p1.pressure ?? 0.5)) * t,
    timestamp: p1.timestamp
  };
}

/**
 * Slices a single stroke by a circular eraser area at (center, radius).
 * Returns modified flag and resulting sub-strokes (or empty array if entirely erased).
 */
export function sliceStrokeByCircle(
  stroke: InkStroke,
  center: { x: number; y: number },
  radius: number
): { modified: boolean; resultingStrokes: InkStroke[] } {
  const effectiveRadius = radius + stroke.width / 2;
  const r2 = effectiveRadius * effectiveRadius;

  const pts = stroke.points;
  if (!pts || pts.length === 0) {
    return { modified: false, resultingStrokes: [] };
  }

  // Single point stroke check
  if (pts.length === 1) {
    const d2 = (pts[0].x - center.x) ** 2 + (pts[0].y - center.y) ** 2;
    if (d2 <= r2) {
      return { modified: true, resultingStrokes: [] };
    }
    return { modified: false, resultingStrokes: [stroke] };
  }

  // 1. Quick check: does any segment come within effectiveRadius of center?
  let anyIntersection = false;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanceToSegment(center, pts[i], pts[i + 1]);
    if (d <= effectiveRadius) {
      anyIntersection = true;
      break;
    }
  }

  if (!anyIntersection) {
    return { modified: false, resultingStrokes: [stroke] };
  }

  // 2. Slice path into surviving sub-polylines
  const survivingSegments: Point[][] = [];
  let currentSegment: Point[] = [];

  const isInside = (p: Point) => (p.x - center.x) ** 2 + (p.y - center.y) ** 2 <= r2;

  let prevInside = isInside(pts[0]);
  if (!prevInside) {
    currentSegment.push({ ...pts[0] });
  }

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const currInside = isInside(p2);

    const intersections = getSegmentCircleIntersections(p1, p2, center, effectiveRadius);

    if (!prevInside && !currInside) {
      // Both endpoints outside
      if (intersections.length === 2) {
        // Enters circle and exits within this segment
        const enterPt = interpolatePoint(p1, p2, intersections[0]);
        const exitPt = interpolatePoint(p1, p2, intersections[1]);

        currentSegment.push(enterPt);
        if (currentSegment.length >= 2) {
          survivingSegments.push(currentSegment);
        }
        currentSegment = [exitPt, { ...p2 }];
      } else {
        // Did not intersect, or only grazed boundary
        currentSegment.push({ ...p2 });
      }
    } else if (!prevInside && currInside) {
      // Enters circle
      const t = intersections.length > 0 ? intersections[0] : 0.5;
      const enterPt = interpolatePoint(p1, p2, t);
      currentSegment.push(enterPt);

      if (currentSegment.length >= 2) {
        survivingSegments.push(currentSegment);
      }
      currentSegment = [];
    } else if (prevInside && !currInside) {
      // Exits circle
      const t = intersections.length > 0 ? intersections[intersections.length - 1] : 0.5;
      const exitPt = interpolatePoint(p1, p2, t);
      currentSegment = [exitPt, { ...p2 }];
    } else {
      // Both inside: discarded
      currentSegment = [];
    }

    prevInside = currInside;
  }

  if (currentSegment.length >= 2) {
    survivingSegments.push(currentSegment);
  }

  // Check if stroke was completely erased
  if (survivingSegments.length === 0) {
    return { modified: true, resultingStrokes: [] };
  }

  // Convert surviving segments to new sub-strokes
  const resultingSubStrokes: InkStroke[] = survivingSegments.map((seg, idx) => ({
    ...stroke,
    id: `${stroke.id}-p${idx}-${Date.now().toString(36)}`,
    points: seg
  }));

  return { modified: true, resultingStrokes: resultingSubStrokes };
}

export class EraserEngine {
  /**
   * Stroke Eraser: On intersection with any point or segment, deletes the ENTIRE vector stroke entity.
   */
  public static executeStrokeEraser(
    strokes: InkStroke[],
    spatialIndex: StrokeSpatialIndex,
    center: { x: number; y: number },
    radius: number
  ): { modified: boolean; updatedStrokes: InkStroke[]; deletedIds: string[] } {
    const hitIds = spatialIndex.queryIntersectingStrokes(center, radius);
    if (hitIds.length === 0) {
      return { modified: false, updatedStrokes: strokes, deletedIds: [] };
    }

    const hitSet = new Set(hitIds);
    const updated = strokes.filter((s) => !hitSet.has(s.id));
    return {
      modified: true,
      updatedStrokes: updated,
      deletedIds: hitIds
    };
  }

  /**
   * Area/Pixel Eraser: Slices through vector lines within its radius, breaking single strokes
   * into smaller path segments without deleting the underlying entity group wholesale unless cleared.
   * Uses fast AABB bounding box rejection before segment intersection maths.
   */
  public static executeAreaEraser(
    strokes: InkStroke[],
    center: { x: number; y: number },
    radius: number
  ): { modified: boolean; updatedStrokes: InkStroke[] } {
    const eraserBox: BoundingBox = {
      minX: center.x - radius,
      minY: center.y - radius,
      maxX: center.x + radius,
      maxY: center.y + radius
    };

    let modifiedAny = false;
    const nextStrokes: InkStroke[] = [];

    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      const strokeBBox = StrokeSpatialIndex.computeBoundingBox(stroke.points, stroke.width / 2);

      // Fast AABB rejection
      if (!StrokeSpatialIndex.intersectsBox(strokeBBox, eraserBox)) {
        nextStrokes.push(stroke);
        continue;
      }

      // Precise segment slicing
      const result = sliceStrokeByCircle(stroke, center, radius);
      if (result.modified) {
        modifiedAny = true;
        nextStrokes.push(...result.resultingStrokes);
      } else {
        nextStrokes.push(stroke);
      }
    }

    return {
      modified: modifiedAny,
      updatedStrokes: modifiedAny ? nextStrokes : strokes
    };
  }
}
