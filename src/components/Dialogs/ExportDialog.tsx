import React, { useState } from 'react';
import { NotebookDocument } from '../../types/document';
import { PageEngine } from '../../pages/PageEngine';
import { TemplateRenderer } from '../../canvas/TemplateRenderer';
import { StrokeRenderer } from '../../canvas/StrokeRenderer';
import { ShapeRenderer } from '../../canvas/ShapeRenderer';
import { jsPDF } from 'jspdf';
import { FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  document: NotebookDocument;
  onClose: () => void;
  customTemplateImage?: HTMLImageElement | null;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  document: doc,
  onClose,
  customTemplateImage
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  if (!isOpen) return null;

  const exportAsPdf = async () => {
    setIsExporting(true);
    setExportProgress('Preparing pages...');

    try {
      const isLandscape = doc.settings.page.orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const { width: pageW, height: pageH } = PageEngine.getPageDimensions(
        doc.settings.page.orientation
      );
      const pages = PageEngine.getAllPageBounds(doc.content.pageCount, {
        mode: doc.settings.mode,
        scrollDirection: doc.settings.scrollDirection,
        orientation: doc.settings.page.orientation
      });

      // Scale for crisp print quality
      const scale = 2;
      const offscreen = window.document.createElement('canvas');
      offscreen.width = pageW * scale;
      offscreen.height = pageH * scale;
      const ctx = offscreen.getContext('2d');

      if (!ctx) throw new Error('Could not create canvas context');

      for (let i = 0; i < pages.length; i++) {
        setExportProgress(`Rendering page ${i + 1} of ${pages.length}...`);
        const page = pages[i];

        ctx.clearRect(0, 0, offscreen.width, offscreen.height);
        ctx.save();
        ctx.scale(scale, scale);

        // Fill background
        ctx.fillStyle = doc.settings.page.backgroundColor;
        ctx.fillRect(0, 0, pageW, pageH);

        // Render template
        TemplateRenderer.renderTemplate(
          ctx,
          { x: 0, y: 0, width: pageW, height: pageH },
          doc.settings.page.template,
          doc.settings.page.backgroundColor,
          customTemplateImage
        );

        // Render strokes that belong or overlap this page
        ctx.save();
        // Translate world coordinates relative to this page
        ctx.translate(-page.x, -page.y);

        // Highlighters
        for (const stroke of doc.content.strokes) {
          if (stroke.isHighlighter) {
            StrokeRenderer.drawStroke(ctx, stroke);
          }
        }
        // Shapes
        for (const shape of doc.content.shapes) {
          ShapeRenderer.drawShape(ctx, shape);
        }
        // Inks
        for (const stroke of doc.content.strokes) {
          if (!stroke.isHighlighter) {
            StrokeRenderer.drawStroke(ctx, stroke);
          }
        }
        ctx.restore();

        ctx.restore();

        const imgData = offscreen.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, isLandscape ? 297 : 210, isLandscape ? 210 : 297);
      }

      setExportProgress('Saving PDF file...');
      pdf.save(`${doc.title.replace(/\s+/g, '_')}_OneBook.pdf`);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Export failed. Check console.');
      setIsExporting(false);
    }
  };

  const exportAsPng = async () => {
    setIsExporting(true);
    setExportProgress('Generating image...');

    try {
      const { width: pageW, height: pageH } = PageEngine.getPageDimensions(
        doc.settings.page.orientation
      );
      const offscreen = window.document.createElement('canvas');
      const scale = 2;
      offscreen.width = pageW * scale;
      offscreen.height = pageH * scale;
      const ctx = offscreen.getContext('2d');

      if (!ctx) throw new Error('Canvas context error');

      ctx.scale(scale, scale);
      ctx.fillStyle = doc.settings.page.backgroundColor;
      ctx.fillRect(0, 0, pageW, pageH);

      TemplateRenderer.renderTemplate(
        ctx,
        { x: 0, y: 0, width: pageW, height: pageH },
        doc.settings.page.template,
        doc.settings.page.backgroundColor,
        customTemplateImage
      );

      for (const stroke of doc.content.strokes) {
        if (stroke.isHighlighter) StrokeRenderer.drawStroke(ctx, stroke);
      }
      for (const shape of doc.content.shapes) {
        ShapeRenderer.drawShape(ctx, shape);
      }
      for (const stroke of doc.content.strokes) {
        if (!stroke.isHighlighter) StrokeRenderer.drawStroke(ctx, stroke);
      }

      const link = window.document.createElement('a');
      link.download = `${doc.title.replace(/\s+/g, '_')}_Page1.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();

      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('PNG export failed', err);
      alert('PNG export failed.');
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#383633] bg-[#1e1d1b] p-6 text-[#e8e6e3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#2d2b28] pb-3">
          <div>
            <h2 className="font-editorial-heading text-xl font-medium tracking-wide text-[#f5f4f0]">
              Export Document
            </h2>
            <p className="font-editorial-mono text-[11px] text-[#8f8b85]">
              Save notebook pages as publication-grade PDF or image
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8f8b85] hover:bg-[#2c2a27] hover:text-[#f5f4f0]"
          >
            <X size={16} />
          </button>
        </div>

        {isExporting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-[#a8a49d]" />
            <span className="mt-3 font-editorial-mono text-xs text-[#d6d3cd]">
              {exportProgress}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={exportAsPdf}
              className="flex w-full items-center gap-3.5 rounded-xl border border-[#383633] bg-[#242321] p-3.5 text-left transition-colors hover:border-[#78716c] hover:bg-[#2c2a27]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#33312e] text-[#f5f4f0]">
                <FileText size={20} />
              </div>
              <div>
                <span className="block text-sm font-semibold text-[#f5f4f0]">
                  Export as PDF Document
                </span>
                <span className="font-editorial-mono text-[11px] text-[#8f8b85]">
                  Multi-page A4 document with high-resolution vector strokes
                </span>
              </div>
            </button>

            <button
              onClick={exportAsPng}
              className="flex w-full items-center gap-3.5 rounded-xl border border-[#383633] bg-[#242321] p-3.5 text-left transition-colors hover:border-[#78716c] hover:bg-[#2c2a27]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#33312e] text-[#f5f4f0]">
                <ImageIcon size={20} />
              </div>
              <div>
                <span className="block text-sm font-semibold text-[#f5f4f0]">
                  Export as High-Res PNG
                </span>
                <span className="font-editorial-mono text-[11px] text-[#8f8b85]">
                  Crisp 2x lossless image of the active page
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
