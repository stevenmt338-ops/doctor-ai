import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Download,
  Edit3,
  FileText,
  Printer,
  Search,
  Trash2,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { formatDateTime, STATUS_LABELS } from '../services/i18n';
import { generateA4ReportPDF } from '../services/pdfService';
import { Language, MedicalReport, ReportStatus } from '../types/medical';
import { A4MedicalReportSheet } from './A4MedicalReportSheet';

interface ReportsLibraryViewProps {
  lang: Language;
  reports: MedicalReport[];
  onOpenReport: (reportId: string) => void;
  onResumeChat: (reportId: string) => void;
  onDeleteReport: (reportId: string) => Promise<void>;
  onStartNewAssessment: () => void;
  onCompareReports: (idA: string, idB: string) => void;
}

export const ReportsLibraryView: React.FC<ReportsLibraryViewProps> = ({
  lang,
  reports,
  onOpenReport,
  onResumeChat,
  onDeleteReport,
  onStartNewAssessment,
  onCompareReports,
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [tab, setTab] = useState<'reports' | 'symptoms'>('reports');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printingReport, setPrintingReport] = useState<MedicalReport | null>(null);
  const [busyPdfId, setBusyPdfId] = useState<string | null>(null);

  const hiddenSheetRef = useRef<HTMLDivElement | null>(null);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.referenceNumber.toLowerCase().includes(q) ||
          r.collectedData.chiefComplaint.toLowerCase().includes(q) ||
          r.collectedData.symptoms.some((s) => s.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const diff =
          new Date(b.localCreatedAt).getTime() - new Date(a.localCreatedAt).getTime();
        return sortOrder === 'newest' ? diff : -diff;
      });
  }, [reports, searchQuery, statusFilter, sortOrder]);

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleQuickDownloadPdf = async (rep: MedicalReport) => {
    setPrintingReport(rep);
    setBusyPdfId(rep.id);
    setTimeout(async () => {
      try {
        if (hiddenSheetRef.current) {
          await generateA4ReportPDF(hiddenSheetRef.current, rep, lang);
        }
      } finally {
        setBusyPdfId(null);
      }
    }, 120);
  };

  const handleQuickPrint = (rep: MedicalReport) => {
    setPrintingReport(rep);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Offscreen / Print target for quick actions */}
      {printingReport && (
        <>
          <div className="hidden print:block">
            <A4MedicalReportSheet report={printingReport} lang={lang} />
          </div>
          <div className="fixed -left-[99999px] top-0 pointer-events-none opacity-0" aria-hidden="true">
            <A4MedicalReportSheet report={printingReport} lang={lang} sheetRef={hiddenSheetRef} />
          </div>
        </>
      )}

      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'تقاريري الصحية' : 'My Health Reports'}
            </h1>
            <p className="text-sm text-[#4A554C] dark:text-[#9DB09F] mt-1">
              {isAr
                ? 'جميع تقييماتك وتقاريرك المحفوظة مرتبة من الأحدث إلى الأقدم، متاحة دائمًا للعرض والطباعة وتنزيل PDF.'
                : 'All your saved health assessments ordered newest-first, always available to view, print, or export as PDF.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedForCompare.length === 2 && (
              <button
                type="button"
                onClick={() => onCompareReports(selectedForCompare[0], selectedForCompare[1])}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-[#4B644A] bg-[#EEF3EC] dark:bg-[#19281C] text-[#1F3323] dark:text-[#E8EFE9] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#4B644A]" />
                <span>{isAr ? 'مقارنة التقييمين المحددين' : 'Compare Selected (2)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartNewAssessment}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تقييم صحي جديد' : 'New Assessment'}</span>
            </button>
          </div>
        </div>

        {/* Sub-view Switcher: Reports Library vs Symptom & Chat Log */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex p-1 rounded-xl bg-[#EEF2EC] dark:bg-[#162218] border border-[#DCE3DA] dark:border-[#233326]">
            <button
              type="button"
              onClick={() => setTab('reports')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                tab === 'reports'
                  ? 'bg-white dark:bg-[#223426] text-[#1F3323] dark:text-white shadow-sm'
                  : 'text-[#4A554C] dark:text-[#9DB09F]'
              }`}
            >
              {isAr ? 'مكتبة التقارير' : 'Reports Library'} ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('symptoms')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                tab === 'symptoms'
                  ? 'bg-white dark:bg-[#223426] text-[#1F3323] dark:text-white shadow-sm'
                  : 'text-[#4A554C] dark:text-[#9DB09F]'
              }`}
            >
              {isAr ? 'سجل الأعراض والمحادثات' : 'Symptom & Chat Timeline'}
            </button>
          </div>

          {reports.length >= 2 && tab === 'reports' && (
            <p className="text-xs text-[#5C6B5E] dark:text-[#8FA392]">
              {isAr
                ? `اختر تقريرين للمقارنة (${selectedForCompare.length}/2 محدد)`
                : `Select 2 reports to compare (${selectedForCompare.length}/2 selected)`}
            </p>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#647366] absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث بعنوان الحالة أو الأعراض أو الرقم المرجعي...'
                  : 'Search by title, symptom, or reference ID...'
              }
              className="w-full h-10 ps-9 pe-4 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm text-[#172119] dark:text-[#E8EFE9] focus:outline-none focus:border-[#4B644A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'completed', 'partial', 'preliminary'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#1F3323] text-white dark:bg-[#4B644A]'
                    : 'bg-[#F3F6F1] dark:bg-[#18241B] text-[#4A554C] dark:text-[#A4B5A6]'
                }`}
              >
                {status === 'all' ? (isAr ? 'الكل' : 'All') : STATUS_LABELS[status][lang]}
              </button>
            ))}

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              aria-label={isAr ? 'الترتيب' : 'Sort order'}
              className="h-9 px-3 rounded-lg bg-[#F3F6F1] dark:bg-[#18241B] border border-[#DCE3DA] dark:border-[#253528] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9]"
            >
              <option value="newest">{isAr ? 'الأحدث إلى الأقدم' : 'Newest First'}</option>
              <option value="oldest">{isAr ? 'الأقدم إلى الأحدث' : 'Oldest First'}</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] text-center space-y-4">
            <FileText className="w-10 h-10 text-[#4B644A] mx-auto" />
            <h2 className="text-lg font-bold text-[#1F3323] dark:text-white">
              {reports.length === 0
                ? isAr
                  ? 'لا توجد تقارير صحية محفوظة بعد'
                  : 'No Health Reports Saved Yet'
                : isAr
                ? 'لا توجد نتائج مطابقة لبحثك'
                : 'No Matching Reports Found'}
            </h2>
            <p className="text-sm text-[#4A554C] dark:text-[#9DB09F] max-w-md mx-auto">
              {isAr
                ? 'ابدأ وصف أعراضك في التقييم الذكي وسيتم إنشاء وحفظ تقريرك الطبي تلقائيًا.'
                : 'Start describing your symptoms in the Smart Assessment and your permanent report will be generated automatically.'}
            </p>
            <button
              type="button"
              onClick={onStartNewAssessment}
              className="px-5 py-2.5 rounded-xl bg-[#1F3323] text-white text-sm font-semibold cursor-pointer"
            >
              {isAr ? 'ابدأ التقييم الصحي الآن' : 'Start Health Assessment'}
            </button>
          </div>
        ) : tab === 'reports' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReports.map((rep) => {
              const isSelectedCompare = selectedForCompare.includes(rep.id);
              return (
                <div
                  key={rep.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-[#121C14] border transition-colors flex flex-col justify-between gap-4 ${
                    isSelectedCompare
                      ? 'border-[#4B644A] ring-1 ring-[#4B644A]'
                      : 'border-[#DCE3DA] dark:border-[#223025]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#1F3323] dark:text-white">
                          {rep.title}
                        </h3>
                        <div className="text-xs text-[#5C6B5E] dark:text-[#8FA392] mt-1 flex flex-wrap items-center gap-1.5">
                          <span>{formatDateTime(rep.localCreatedAt, lang)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#2C432F] dark:text-[#98B999]">
                            {STATUS_LABELS[rep.status][lang]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{rep.referenceNumber}</span>
                        </div>
                      </div>

                      {reports.length >= 2 && (
                        <label className="inline-flex items-center gap-1.5 text-xs text-[#4A554C] dark:text-[#9DB09F] cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelectedCompare}
                            onChange={() => toggleCompareSelection(rep.id)}
                            className="accent-[#4B644A] w-4 h-4 rounded"
                          />
                          <span>{isAr ? 'مقارنة' : 'Compare'}</span>
                        </label>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#4A554C] dark:text-[#A4B5A6] line-clamp-2">
                      {rep.collectedData.chiefComplaint ||
                        (isAr ? 'تقييم أولي قيد الاستكمال' : 'Preliminary assessment in progress')}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE4] dark:border-[#223025] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReport(rep.id)}
                      className="h-8 px-3 rounded-lg bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-xs font-semibold cursor-pointer"
                    >
                      {isAr ? 'فتح التقرير' : 'Open Report'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onResumeChat(rep.id)}
                      className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-[#CED7CC] dark:border-[#28392B] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] hover:bg-[#F3F6F1] dark:hover:bg-[#18241B] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#4B644A]" />
                      <span>{rep.status === 'completed' ? (isAr ? 'المحادثة' : 'Chat') : (isAr ? 'إكمال' : 'Continue')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickDownloadPdf(rep)}
                      disabled={busyPdfId === rep.id}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-[#CED7CC] dark:border-[#28392B] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] hover:bg-[#F3F6F1] dark:hover:bg-[#18241B] cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5 text-[#4B644A]" />
                      <span>{busyPdfId === rep.id ? '...' : 'PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPrint(rep)}
                      aria-label={isAr ? 'طباعة التقرير' : 'Print report'}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#CED7CC] dark:border-[#28392B] text-[#1F3323] dark:text-[#E8EFE9] hover:bg-[#F3F6F1] dark:hover:bg-[#18241B] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#4B644A]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(rep.id)}
                      aria-label={isAr ? 'حذف التقرير' : 'Delete report'}
                      className="h-8 w-8 ms-auto inline-flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Symptom & Chat Timeline View */
          <div className="bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] rounded-2xl divide-y divide-[#E5EAE3] dark:divide-[#223025]">
            {filteredReports.map((rep) => (
              <div key={rep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs text-[#5C6B5E] dark:text-[#8FA392]">
                    {formatDateTime(rep.localCreatedAt, lang)} · {STATUS_LABELS[rep.status][lang]}
                  </div>
                  <div className="text-sm font-bold text-[#1F3323] dark:text-white">
                    {rep.title}
                  </div>
                  <div className="text-xs text-[#4A554C] dark:text-[#A4B5A6]">
                    {isAr ? 'الأعراض المسجلة:' : 'Symptoms:'}{' '}
                    {rep.collectedData.symptoms.join('، ') || rep.collectedData.chiefComplaint || '—'}
                    {rep.collectedData.severity ? ` · ${isAr ? 'الشدة:' : 'Severity:'} ${rep.collectedData.severity}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResumeChat(rep.id)}
                    className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#4B644A]" />
                    <span>{isAr ? 'عرض المحادثة' : 'View Chat'} ({rep.messages.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenReport(rep.id)}
                    className="h-9 px-3 rounded-lg bg-[#1F3323] text-white text-xs font-semibold cursor-pointer"
                  >
                    {isAr ? 'التقرير' : 'Report'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#253528] rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'تأكيد حذف التقرير' : 'Confirm Report Deletion'}
            </h3>
            <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6]">
              {isAr
                ? 'هل أنت متأكد من حذف هذا التقرير الطبي نهائيًا من جهازك وحسابك؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to permanently delete this medical report from your device and account? This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="h-9 px-4 rounded-lg border border-[#CED7CC] dark:border-[#28392B] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await onDeleteReport(target);
                }}
                className="h-9 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'نعم، احذف التقرير' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
