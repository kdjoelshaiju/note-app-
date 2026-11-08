import { Point, ShapeType, ShapeItem } from '../types/document';

export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function distanceToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return distance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

export function getPointsBounds(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

/**
 * Checks if a point lies inside a polygon (ray-casting algorithm)
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Straightens lines if deviation from a direct line is within tolerance
 */
export function straightenLineIfPossible(points: Point[], tolerance = 15): Point[] | null {
  if (points.length < 5) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const totalDist = distance(start, end);
  if (totalDist < 20) return null; // Too short to consider a line

  let maxDeviation = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], start, end);
    if (d > maxDeviation) {
      maxDeviation = d;
    }
  }

  // Tolerance relative to length, capped
  const relativeTolerance = Math.max(tolerance, totalDist * 0.12);
  if (maxDeviation <= relativeTolerance) {
    // Generate a clean straight stroke with interpolated points to preserve pressure feel
    const count = 10;
    const straightPoints: Point[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      straightPoints.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        pressure: start.pressure ?? 0.5,
        timestamp: Date.now()
      });
    }
    return straightPoints;
  }
  return null;
}

/**
 * Recognizes common hand-drawn geometric shapes (Circle, Rectangle, Triangle, Line)
 */
/**
 * Recognizes common hand-drawn geometric shapes (Circle, Rectangle, Triangle, Line)
 * Requires strict geometric fidelity so normal handwriting or doodles are never falsely detected.
 */
export function recognizeShape(points: Point[]): { type: ShapeType; startX: number; startY: number; endX: number; endY: number } | null {
  if (points.length < 10) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const bounds = getPointsBounds(points);
  const diag = Math.hypot(bounds.width, bounds.height);
  if (diag < 32 || bounds.width < 16 || bounds.height < 16) return null; // Avoid tiny handwriting letters

  const endDistance = distance(start, end);
  const isClosed = endDistance < Math.max(30, diag * 0.22);

  if (isClosed) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const radiusApprox = (bounds.width + bounds.height) / 4;
    let radiusDeviation = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const d = Math.hypot(p.x - centerX, p.y - centerY);
      radiusDeviation += Math.abs(d - radiusApprox);
    }
    const avgDeviation = radiusDeviation / points.length;
    const aspectRatio = bounds.width / Math.max(1, bounds.height);

    // 1. Circle: strict radial variance and aspect ratio close to 1
    if (avgDeviation < radiusApprox * 0.18 && aspectRatio >= 0.75 && aspectRatio <= 1.33) {
      return {
        type: 'circle',
        startX: bounds.x,
        startY: bounds.y,
        endX: bounds.x + bounds.width,
        endY: bounds.y + bounds.height
      };
    }

    // 2. Triangle: 3 dominant vertices and area ratio ~ 40-62% of bounding box
    const p1 = points[0];
    const p2 = points[Math.floor(points.length / 3)];
    const p3 = points[Math.floor((2 * points.length) / 3)];
    const triArea = Math.abs(
      (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
    );
    const boxArea = bounds.width * bounds.height;
    if (boxArea > 350 && triArea / boxArea >= 0.36 && triArea / boxArea <= 0.64) {
      // Check that the 3 points are reasonably spread out
      const d12 = distance(p1, p2);
      const d23 = distance(p2, p3);
      const d31 = distance(p3, p1);
      const minEdge = Math.min(d12, d23, d31);
      if (minEdge > diag * 0.3) {
        return {
          type: 'triangle',
          startX: bounds.x,
          startY: bounds.y,
          endX: bounds.x + bounds.width,
          endY: bounds.y + bounds.height
        };
      }
    }

    // 3. Rectangle / Square: points must lie close to the 4 edges of the bounding box
    // and have points reaching near at least 3 of the 4 bounding box corners
    const minDim = Math.min(bounds.width, bounds.height);
    let edgeDistSum = 0;
    let nearTopLeft = false;
    let nearTopRight = false;
    let nearBottomLeft = false;
    let nearBottomRight = false;
    const cornerThreshold = Math.max(12, diag * 0.18);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const distToLeft = Math.abs(p.x - bounds.x);
      const distToRight = Math.abs(p.x - (bounds.x + bounds.width));
      const distToTop = Math.abs(p.y - bounds.y);
      const distToBottom = Math.abs(p.y - (bounds.y + bounds.height));

      edgeDistSum += Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (Math.hypot(p.x - bounds.x, p.y - bounds.y) < cornerThreshold) nearTopLeft = true;
      if (Math.hypot(p.x - (bounds.x + bounds.width), p.y - bounds.y) < cornerThreshold) nearTopRight = true;
      if (Math.hypot(p.x - bounds.x, p.y - (bounds.y + bounds.height)) < cornerThreshold) nearBottomLeft = true;
      if (Math.hypot(p.x - (bounds.x + bounds.width), p.y - (bounds.y + bounds.height)) < cornerThreshold) nearBottomRight = true;
    }

    const avgEdgeDist = edgeDistSum / points.length;
    const cornerCount = (nearTopLeft ? 1 : 0) + (nearTopRight ? 1 : 0) + (nearBottomLeft ? 1 : 0) + (nearBottomRight ? 1 : 0);

    if (avgEdgeDist < minDim * 0.16 && cornerCount >= 3 && aspectRatio >= 0.35 && aspectRatio <= 3.0) {
      return {
        type: 'rectangle',
        startX: bounds.x,
        startY: bounds.y,
        endX: bounds.x + bounds.width,
        endY: bounds.y + bounds.height
      };
    }
  } else {
    // Open path: check if straight line
    const totalDist = distance(start, end);
    if (totalDist > 35) {
      let maxDeviation = 0;
      for (let i = 1; i < points.length - 1; i++) {
        const d = distanceToSegment(points[i], start, end);
        if (d > maxDeviation) maxDeviation = d;
      }
      if (maxDeviation <= Math.min(10, totalDist * 0.08)) {
        return {
          type: 'line',
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y
        };
      }
    }
  }

  return null;
}

/**
 * Chaikin's corner-cutting algorithm for smoothing finalized vector paths on pointerup.
 * Produces natural, buttery-smooth curves while preserving start and end points and pressure profile.
 */
export function chaikinSmooth(points: Point[], iterations = 1): Point[] {
  if (points.length <= 2) return points;
  let current = points;

  for (let it = 0; it < iterations; it++) {
    const next: Point[] = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];

      const q: Point = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
        pressure: (p0.pressure ?? 0.5) * 0.75 + (p1.pressure ?? 0.5) * 0.25,
        timestamp: p0.timestamp
      };

      const r: Point = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
        pressure: (p0.pressure ?? 0.5) * 0.25 + (p1.pressure ?? 0.5) * 0.75,
        timestamp: p1.timestamp
      };

      next.push(q, r);
    }
    next.push(current[current.length - 1]);
    current = next;
  }

  return current;
}
