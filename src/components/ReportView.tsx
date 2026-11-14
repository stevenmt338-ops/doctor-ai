import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Edit3,
  Printer,
  RefreshCw,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { COPY, STATUS_LABELS } from '../services/i18n';
import { formatReportAsText, generateA4ReportPDF } from '../services/pdfService';
import { Language, MedicalReport } from '../types/medical';
import { A4MedicalReportSheet } from './A4MedicalReportSheet';

interface ReportViewProps {
  lang: Language;
  report: MedicalReport | null;
  isOnline: boolean;
  isAnalyzing: boolean;
  onBackToChat: () => void;
  onRunAIAnalysis: () => Promise<void>;
  onRegenerateReport: () => Promise<void>;
  onGoToReports: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  lang,
  report,
  isOnline,
  isAnalyzing,
  onBackToChat,
  onRunAIAnalysis,
  onRegenerateReport,
  onGoToReports,
}) => {
  const isAr = lang === 'ar';
  const t = COPY[lang];
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#1F3323] dark:text-white">
          {isAr ? 'لا يوجد تقرير محدد حاليًا' : 'No Report Selected'}
        </h2>
        <p className="text-sm text-[#4A554C] dark:text-[#9DB09F]">
          {isAr
            ? 'ابدأ تقييمًا صحيًا جديدًا أو اختر تقريرًا من مكتبة تقاريرك.'
            : 'Start a new health assessment or open a report from your library.'}
        </p>
        <button
          type="button"
          onClick={onGoToReports}
          className="px-5 py-2.5 rounded-xl bg-[#1F3323] text-white text-sm font-semibold cursor-pointer"
        >
          {t.navReports}
        </button>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (!sheetRef.current || downloading) return;
    setDownloading(true);
    setPdfError(null);
    try {
      await generateA4ReportPDF(sheetRef.current, report, lang);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfError(
        isAr
          ? 'حدث خطأ أثناء تجهيز ملف PDF. يمكنك استخدام زر طباعة التقرير ثم اختيار حفظ كـ PDF.'
          : 'Could not generate PDF file directly. You can use Print Report and choose Save as PDF.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatReportAsText(report, lang));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#E9EDE7] dark:bg-[#0D140F] pb-16">
      {/* Persistent Sticky Action Bar */}
      <div className="no-print sticky top-16 z-30 bg-white/95 dark:bg-[#121C14]/95 backdrop-blur-md border-b border-[#D8DFD5] dark:border-[#223025]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToChat}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#17231A] hover:bg-[#F3F6F1] text-xs sm:text-sm font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer"
            >
              <BackIcon className="w-4 h-4" />
              <span>{t.backToChat}</span>
            </button>
            <div className="hidden sm:block text-xs text-[#4A554C] dark:text-[#9DB09F]">
              <span className="font-semibold text-[#1F3323] dark:text-white">
                {STATUS_LABELS[report.status][lang]}
              </span>
              <span className="mx-1.5">·</span>
              <span className="font-mono">{report.referenceNumber}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] dark:hover:bg-[#5B7A5A] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? (isAr ? 'جاري إنشاء PDF...' : 'Creating PDF...') : t.downloadPdf}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#17231A] hover:bg-[#F3F6F1] text-xs sm:text-sm font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#4B644A]" />
              <span>{t.printReport}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#17231A] hover:bg-[#F3F6F1] text-xs sm:text-sm font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-[#4B644A]" />}
              <span>{copied ? t.copied : t.copyReport}</span>
            </button>

            <button
              type="button"
              onClick={onRegenerateReport}
              disabled={isAnalyzing}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#17231A] hover:bg-[#F3F6F1] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4B644A] ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isAr ? 'إعادة إنشاء' : 'Regenerate'}</span>
            </button>

            {isOnline && (
              <button
                type="button"
                onClick={onRunAIAnalysis}
                disabled={isAnalyzing}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3EC] dark:bg-[#1B2A1E] hover:bg-[#E1EAE0] text-xs font-semibold text-[#1F3323] dark:text-[#CFE0D1] cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#4B644A]" />
                <span>{isAnalyzing ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحليل ذكي' : 'AI Analyze')}</span>
              </button>
            )}

            {report.status !== 'completed' && (
              <button
                type="button"
                onClick={onBackToChat}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#F4F6F3] dark:bg-[#1A261C] text-xs font-medium text-[#2C432F] dark:text-[#CFE0D1] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'إكمال التقييم' : 'Complete'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="no-print max-w-[794px] mx-auto px-4 pt-5 space-y-2">
        {!isOnline && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'أنت غير متصل بالإنترنت حاليًا. يتم عرض التقرير وتنزيل PDF من النسخة المحفوظة محليًا بشكل طبيعي.'
                : 'You are currently offline. Viewing, PDF download, and printing remain fully available from your local saved copy.'}
            </span>
          </div>
        )}
        {pdfError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
            {pdfError}
          </div>
        )}
      </div>

      {/* A4 Paper Container */}
      <div className="px-3 sm:px-6 pt-6">
        <A4MedicalReportSheet report={report} lang={lang} sheetRef={sheetRef} />
      </div>
    </div>
  );
};
