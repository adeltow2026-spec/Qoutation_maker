import React, { useState, useEffect, useRef } from 'react';
import { Quotation, CompanySettings, Customer } from '../types';
import { PrintQuotation } from './PrintQuotation';
import {
  Printer,
  ArrowLeft,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  Landmark,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface PrintPreviewModalProps {
  quotation: Quotation;
  customer?: Customer;
  settings: CompanySettings;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  quotation,
  customer,
  settings,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(true);
  const [showPhotos, setShowPhotos] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Close on Escape key, trigger print on Ctrl/Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clear transient feedback after 4 seconds
  useEffect(() => {
    if (!feedbackNotice) return;
    const timer = setTimeout(() => {
      setFeedbackNotice(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedbackNotice]);

  // Extract all stylesheets and style rules from current page
  const getDocumentStyles = (): string => {
    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join('\n');

    return `
      ${styleTags}
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 12mm 12mm;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        #print-area {
          padding: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 210mm !important;
          box-shadow: none !important;
          border: none !important;
        }
        .no-print {
          display: none !important;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        thead {
          display: table-header-group !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      </style>
    `;
  };

  // 1. Direct 1-Click PDF Download via html2pdf
  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) {
      setFeedbackNotice({
        type: 'warning',
        message: 'Could not find printable quotation content.',
      });
      return;
    }

    setIsGeneratingPdf(true);
    setFeedbackNotice({
      type: 'info',
      message: 'Compiling high-resolution A4 PDF document...',
    });

    try {
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: `Quotation-${quotation.quoteNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(printArea).save();

      setFeedbackNotice({
        type: 'success',
        message: `Quotation-${quotation.quoteNo}.pdf downloaded successfully!`,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      setFeedbackNotice({
        type: 'warning',
        message: 'Direct PDF download encountered an issue. Try the "Print" button instead.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Open standalone print window (bypasses iframe restrictions)
  const openStandalonePrintWindow = (autoTriggerPrint: boolean = true) => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setFeedbackNotice({
          type: 'warning',
          message: 'Pop-up was blocked by your browser. Please allow pop-ups or click "Download PDF".',
        });
        return;
      }

      const styles = getDocumentStyles();

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Quotation ${quotation.quoteNo} - ${quotation.customerName || 'Client'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
            ${styles}
          </head>
          <body>
            <div style="padding: 16px 20px; max-width: 210mm; margin: 0 auto;">
              ${printArea.outerHTML}
            </div>
            ${
              autoTriggerPrint
                ? `<script>
                    window.addEventListener('load', function() {
                      setTimeout(function() {
                        window.focus();
                        window.print();
                      }, 350);
                    });
                  </script>`
                : ''
            }
          </body>
        </html>
      `);
      printWindow.document.close();

      setFeedbackNotice({
        type: 'success',
        message: autoTriggerPrint
          ? 'Opening print dialog in dedicated window...'
          : 'Opened standalone quotation in new tab.',
      });
    } catch (err) {
      console.error('Print window error:', err);
      // Fallback to window.print
      try {
        window.print();
      } catch (innerErr) {
        setFeedbackNotice({
          type: 'warning',
          message: 'Unable to open browser print dialog. Please use "Download PDF".',
        });
      }
    }
  };

  // 3. Primary Print Handler: Intelligently handles iframe sandboxes
  const handlePrint = () => {
    const isInIframe = window.self !== window.top;

    // In an iframe (like AI Studio preview), window.print() is blocked by browser without allow-modals
    if (isInIframe) {
      openStandalonePrintWindow(true);
      return;
    }

    // Outside iframe: standard window.print()
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print failed, falling back to standalone window:', err);
      openStandalonePrintWindow(true);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 15, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 15, 60));
  };

  const handleFitScreen = () => {
    setZoom(100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm overflow-y-auto print-modal-overlay"
      id="print-preview-modal-overlay"
    >
      {/* Top Preview Controls Bar (Hidden during actual print) */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 no-print shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="border-l border-slate-700 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white">
                  Quotation Print Preview:
                </span>
                <span className="px-2 py-0.5 bg-amber-900/70 border border-amber-600/60 rounded font-mono font-bold text-xs text-amber-200">
                  {quotation.quoteNo}
                </span>
                <span className="text-xs text-slate-300 hidden md:inline">
                  • {customer?.name || quotation.customerName || 'Valued Client'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Document Toggles & Zoom */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Toggles */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px]">
              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <Landmark className="w-3 h-3 text-slate-400" />
                Bank Wire
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTerms}
                  onChange={(e) => setShowTerms(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <FileCheck2 className="w-3 h-3 text-slate-400" />
                Terms (11)
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPhotos}
                  onChange={(e) => setShowPhotos(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <ImageIcon className="w-3 h-3 text-slate-400" />
                Drawings
              </label>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-slate-300">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoom <= 60}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 select-none font-bold text-slate-200">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoom >= 150}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitScreen}
                title="Reset Zoom to 100%"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors border-l border-slate-700 ml-0.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 1: Instant Direct Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Download official PDF directly to your device"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
            </button>

            {/* Action 2: Browser Print Dialog */}
            <button
              type="button"
              onClick={handlePrint}
              title="Open browser print / Save as PDF dialog"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            {/* Action 3: Open in clean separate tab */}
            <button
              type="button"
              onClick={() => openStandalonePrintWindow(false)}
              title="Open quotation in standalone full-screen tab"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Close Preview (Esc)"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Status / Feedback notification */}
        {feedbackNotice && (
          <div
            className={`max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
                : feedbackNotice.type === 'warning'
                ? 'bg-amber-950/80 border-amber-600/60 text-amber-200'
                : 'bg-blue-950/80 border-blue-600/60 text-blue-200'
            }`}
          >
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span className="font-medium">{feedbackNotice.message}</span>
          </div>
        )}

        {/* Tip Banner */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong>Two Ways to Save:</strong> Click <strong className="text-emerald-400">Download PDF</strong> for instant file download, or click <strong className="text-blue-400">Print</strong> to open your browser&apos;s printer dialog.
            </span>
          </div>
          <span className="hidden md:inline text-slate-500 font-mono text-[10px]">
            Shortcuts: [Cmd/Ctrl + P] Print • [Esc] Exit
          </span>
        </div>
      </div>

      {/* Realistic A4 Canvas Workspace Stage */}
      <div className="p-4 sm:p-8 md:p-12 flex-1 flex justify-center items-start print-paper-stage">
        <div
          ref={printAreaRef}
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-[210mm] bg-white text-slate-900 rounded-sm shadow-2xl ring-1 ring-black/10 overflow-visible print-paper-sheet"
        >
          <PrintQuotation
            quotation={quotation}
            customer={customer}
            settings={settings}
            showBankDetails={showBankDetails}
            showTerms={showTerms}
            showPhotos={showPhotos}
          />
        </div>
      </div>
    </div>
  );
};
