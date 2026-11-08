import { ShapeItem } from '../types/document';

export class ShapeRenderer {
  static drawShape(ctx: CanvasRenderingContext2D, shape: ShapeItem) {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shape.lineType === 'dashed') {
      ctx.setLineDash([Math.max(8, shape.width * 3.5), Math.max(6, shape.width * 2.2)]);
    } else if (shape.lineType === 'dotted') {
      ctx.setLineDash([Math.max(1, shape.width * 0.8), Math.max(6, shape.width * 2.5)]);
    } else {
      ctx.setLineDash([]);
    }

    const minX = Math.min(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const width = Math.abs(shape.endX - shape.startX);
    const height = Math.abs(shape.endY - shape.startY);

    if (shape.fill === 'solid') {
      ctx.fillStyle = shape.fillColor || shape.color;
    } else if (shape.fill === 'transparent') {
      ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
    }

    ctx.beginPath();

    switch (shape.type) {
      case 'line': {
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
        break;
      }

      case 'arrow': {
        // Draw line
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
        const headLength = Math.max(12, shape.width * 3);
        ctx.beginPath();
        ctx.moveTo(shape.endX, shape.endY);
        ctx.lineTo(
          shape.endX - headLength * Math.cos(angle - Math.PI / 6),
          shape.endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(shape.endX, shape.endY);
        ctx.lineTo(
          shape.endX - headLength * Math.cos(angle + Math.PI / 6),
          shape.endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      }

      case 'rectangle': {
        if (shape.fill && shape.fill !== 'none') {
          ctx.fillRect(minX, minY, width, height);
        }
        ctx.strokeRect(minX, minY, width, height);
        break;
      }

      case 'rounded-rectangle': {
        const radius = Math.min(16, width / 4, height / 4);
        ctx.roundRect(minX, minY, width, height, radius);
        if (shape.fill && shape.fill !== 'none') {
          ctx.fill();
        }
        ctx.stroke();
        break;
      }

      case 'circle': {
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
        ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, Math.PI * 2);
        if (shape.fill && shape.fill !== 'none') {
          ctx.fill();
        }
        ctx.stroke();
        break;
      }

      case 'triangle': {
        const topX = minX + width / 2;
        const topY = minY;
        const leftX = minX;
        const leftY = minY + height;
        const rightX = minX + width;
        const rightY = minY + height;

        ctx.moveTo(topX, topY);
        ctx.lineTo(rightX, rightY);
        ctx.lineTo(leftX, leftY);
        ctx.closePath();
        if (shape.fill && shape.fill !== 'none') {
          ctx.fill();
        }
        ctx.stroke();
        break;
      }

      case 'polygon': {
        // Regular hexagon
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        const radius = Math.min(width, height) / 2;
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const px = centerX + radius * Math.cos(a);
          const py = centerY + radius * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (shape.fill && shape.fill !== 'none') {
          ctx.fill();
        }
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }
}
