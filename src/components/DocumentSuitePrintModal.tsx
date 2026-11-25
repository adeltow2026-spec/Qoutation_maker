import React, { useState, useEffect, useRef } from 'react';
import {
  CompanySettings,
  FinishCertificateDocument,
  ProjectDocumentSuite,
  ProjectProgressionDocument,
  SampleConfirmationDocument,
  VariationOrderDocument,
} from '../types';
import {
  PrintContractDocument,
  PrintFinishCertificateDocument,
  PrintProjectProgressionDocument,
  PrintSampleConfirmationDocument,
  PrintVariationOrderDocument,
} from './PrintDocumentSuite';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

export type PrintableSuiteTarget =
  | { type: 'contract' }
  | { type: 'sample'; doc: SampleConfirmationDocument }
  | { type: 'vo'; doc: VariationOrderDocument }
  | { type: 'finish'; doc: FinishCertificateDocument }
  | { type: 'progression'; doc: ProjectProgressionDocument };

interface DocumentSuitePrintModalProps {
  suite: ProjectDocumentSuite;
  target: PrintableSuiteTarget;
  settings: CompanySettings;
  onClose: () => void;
}

export const DocumentSuitePrintModal: React.FC<DocumentSuitePrintModalProps> = ({
  suite,
  target,
  settings,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(95);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const docMeta = (() => {
    if (target.type === 'contract') {
      return {
        label: 'Contract Agreement',
        refNo: suite.contract.contractNo || 'CON-2026-001',
        filename: `${suite.contract.contractNo || 'Contract'}.pdf`,
      };
    }
    if (target.type === 'sample') {
      return {
        label: 'Sample Confirmation',
        refNo: `${suite.contract.contractNo} / ${target.doc.sampleId}`,
        filename: `SampleConfirmation-${target.doc.sampleId}-${suite.contract.contractNo}.pdf`,
      };
    }
    if (target.type === 'vo') {
      return {
        label: 'Variation Order',
        refNo: `${suite.contract.contractNo} / ${target.doc.voNo}`,
        filename: `VariationOrder-${target.doc.voNo}-${suite.contract.contractNo}.pdf`,
      };
    }
    if (target.type === 'finish') {
      return {
        label: 'Finish Certificate',
        refNo: `${suite.contract.contractNo} / ${target.doc.fcNo}`,
        filename: `FinishCertificate-${target.doc.fcNo}-${suite.contract.contractNo}.pdf`,
      };
    }
    return {
      label: 'Project Progression Report',
      refNo: `${suite.contract.contractNo} / ${target.doc.reportNo}`,
      filename: `ProjectProgression-${target.doc.reportNo}-${suite.contract.contractNo}.pdf`,
    };
  })();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const getDocumentStyles = () => {
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((n) => n.outerHTML)
      .join('\n');
    return `
      ${styleTags}
      <style>
        @page { size: A4 portrait; margin: 0; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #111111 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Candara', 'Optima', 'Calibri', 'Segoe UI', Arial, sans-serif !important;
        }
        #print-area {
          padding: 0 !important;
          margin: 0 auto !important;
          width: 210mm !important;
          gap: 0 !important;
          background: #ffffff !important;
        }
        .a4-sheet {
          width: 210mm !important;
          min-height: 296mm !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
        }
        .a4-page-break {
          page-break-after: always !important;
          break-after: page !important;
        }
        .no-print { display: none !important; }
        table { border-collapse: collapse !important; width: 100% !important; }
        thead { display: table-header-group !important; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      </style>
    `;
  };

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    setIsGeneratingPdf(true);
    setFeedback({ type: 'info', message: `Compiling ${docMeta.filename}...` });

    // Temporarily reset zoom transform and strip on-screen gap/shadows so html2pdf captures exact 100% A4 sheets
    const prevGap = printArea.style.gap;
    const prevTransform = printRef.current ? printRef.current.style.transform : '';
    const sheets = Array.from(printArea.querySelectorAll<HTMLElement>('.a4-sheet'));
    const prevShadows = sheets.map((s) => ({ boxShadow: s.style.boxShadow, outline: s.style.outline }));

    printArea.style.gap = '0px';
    if (printRef.current) {
      printRef.current.style.transform = 'none';
    }
    sheets.forEach((s) => {
      s.style.boxShadow = 'none';
      s.style.outline = 'none';
    });

    try {
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: docMeta.filename,
        image: { type: 'jpeg' as const, quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css'], after: '.a4-page-break' },
      };
      await html2pdf().set(opt).from(printArea).save();
      setFeedback({ type: 'success', message: `${docMeta.filename} downloaded successfully.` });
    } catch (err) {
      console.error('Document Suite PDF error:', err);
      setFeedback({ type: 'warning', message: 'PDF export encountered an error. Use Print instead.' });
    } finally {
      printArea.style.gap = prevGap;
      if (printRef.current) {
        printRef.current.style.transform = prevTransform;
      }
      sheets.forEach((s, idx) => {
        s.style.boxShadow = prevShadows[idx].boxShadow;
        s.style.outline = prevShadows[idx].outline;
      });
      setIsGeneratingPdf(false);
    }
  };

  const openPrintWindow = (autoPrint: boolean) => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    try {
      const win = window.open('', '_blank');
      if (!win) {
        setFeedback({ type: 'warning', message: 'Pop-up blocked. Please allow pop-ups or click Download PDF.' });
        return;
      }
      win.document.open();
      win.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <base href="${window.location.origin}/" />
            <title>${docMeta.label} - ${docMeta.refNo}</title>
            ${getDocumentStyles()}
          </head>
          <body>
            ${printArea.outerHTML}
            ${
              autoPrint
                ? `<script>setTimeout(function(){ window.focus(); window.print(); }, 450);</script>`
                : ''
            }
          </body>
        </html>
      `);
      win.document.close();
    } catch {
      try {
        window.print();
      } catch {
        setFeedback({ type: 'warning', message: 'Unable to open print dialog. Please use Download PDF.' });
      }
    }
  };

  const handlePrint = () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      openPrintWindow(true);
      return;
    }
    try {
      window.print();
    } catch {
      openPrintWindow(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm overflow-y-auto print-modal-overlay">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-white px-4 sm:px-6 py-3 no-print shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="border-l border-slate-700 pl-3 text-xs">
              <span className="font-bold text-white">{docMeta.label}</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="font-mono text-amber-300 font-semibold">{docMeta.refNo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-slate-300">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 15))}
                disabled={zoom <= 60}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 font-bold">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(140, z + 15))}
                disabled={zoom >= 140}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(95)}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded border-l border-slate-700 ml-0.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => openPrintWindow(false)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
                : feedback.type === 'warning'
                ? 'bg-amber-950/80 border-amber-600/60 text-amber-200'
                : 'bg-blue-950/80 border-blue-600/60 text-blue-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* A4 Paper Stage (renders discrete A4 sheets with realistic page separation on screen) */}
      <div className="p-4 sm:p-8 flex-1 flex justify-center items-start print-paper-stage">
        <div
          ref={printRef}
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-fit overflow-visible print-paper-sheet [&_.a4-sheet]:shadow-2xl [&_.a4-sheet]:ring-1 [&_.a4-sheet]:ring-black/15"
        >
          {target.type === 'contract' && (
            <PrintContractDocument contract={suite.contract} settings={settings} />
          )}
          {target.type === 'sample' && (
            <PrintSampleConfirmationDocument suite={suite} sample={target.doc} settings={settings} />
          )}
          {target.type === 'vo' && (
            <PrintVariationOrderDocument suite={suite} vo={target.doc} settings={settings} />
          )}
          {target.type === 'finish' && (
            <PrintFinishCertificateDocument suite={suite} fc={target.doc} settings={settings} />
          )}
          {target.type === 'progression' && (
            <PrintProjectProgressionDocument suite={suite} report={target.doc} settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
};
