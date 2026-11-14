import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDateTime, STATUS_LABELS, URGENCY_LABELS } from '../services/i18n';
import { Language, MedicalReport } from '../types/medical';

interface CompareReportsViewProps {
  lang: Language;
  reportA: MedicalReport | null;
  reportB: MedicalReport | null;
  onBack: () => void;
  onOpenReport: (id: string) => void;
}

export const CompareReportsView: React.FC<CompareReportsViewProps> = ({
  lang,
  reportA,
  reportB,
  onBack,
  onOpenReport,
}) => {
  const isAr = lang === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  if (!reportA || !reportB) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-sm text-[#4A554C] dark:text-[#9DB09F]">
          {isAr ? 'يرجى تحديد تقريرين للمقارنة.' : 'Please select two reports to compare.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[#1F3323] text-white text-xs font-semibold cursor-pointer"
        >
          {isAr ? 'العودة للتقارير' : 'Back to Reports'}
        </button>
      </div>
    );
  }

  const rows: { label: string; valA: string; valB: string }[] = [
    {
      label: isAr ? 'تاريخ التقييم' : 'Assessment Date',
      valA: formatDateTime(reportA.localCreatedAt, lang),
      valB: formatDateTime(reportB.localCreatedAt, lang),
    },
    {
      label: isAr ? 'حالة التقرير' : 'Status',
      valA: STATUS_LABELS[reportA.status][lang],
      valB: STATUS_LABELS[reportB.status][lang],
    },
    {
      label: isAr ? 'الشكوى الرئيسية' : 'Chief Complaint',
      valA: reportA.collectedData.chiefComplaint || '—',
      valB: reportB.collectedData.chiefComplaint || '—',
    },
    {
      label: isAr ? 'الأعراض' : 'Symptoms',
      valA: reportA.collectedData.symptoms.join('، ') || '—',
      valB: reportB.collectedData.symptoms.join('، ') || '—',
    },
    {
      label: isAr ? 'مكان الألم' : 'Location',
      valA: reportA.collectedData.painLocation || '—',
      valB: reportB.collectedData.painLocation || '—',
    },
    {
      label: isAr ? 'الشدة' : 'Severity',
      valA: reportA.collectedData.severity || '—',
      valB: reportB.collectedData.severity || '—',
    },
    {
      label: isAr ? 'المدة' : 'Duration',
      valA: reportA.collectedData.duration || reportA.collectedData.onsetTime || '—',
      valB: reportB.collectedData.duration || reportB.collectedData.onsetTime || '—',
    },
    {
      label: isAr ? 'درجة الاستعجال' : 'Urgency',
      valA: reportA.aiAnalysis ? URGENCY_LABELS[reportA.aiAnalysis.urgencyLevel][lang] : '—',
      valB: reportB.aiAnalysis ? URGENCY_LABELS[reportB.aiAnalysis.urgencyLevel][lang] : '—',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#17231A] text-xs font-medium cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
            <span>{isAr ? 'العودة' : 'Back'}</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F3323] dark:text-white">
            {isAr ? 'مقارنة تقييمين صحيين' : 'Compare Two Health Assessments'}
          </h1>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] rounded-2xl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E3E8E1] dark:border-[#223025] bg-[#F5F7F4] dark:bg-[#17231A]">
              <th className="p-4 text-start text-xs font-semibold text-[#5C6B5E] dark:text-[#8FA392] w-1/5">
                {isAr ? 'البند' : 'Dimension'}
              </th>
              <th className="p-4 text-start w-2/5">
                <div className="font-bold text-[#1F3323] dark:text-white">{reportA.title}</div>
                <button
                  type="button"
                  onClick={() => onOpenReport(reportA.id)}
                  className="text-xs text-[#4B644A] hover:underline font-mono mt-0.5 cursor-pointer"
                >
                  {reportA.referenceNumber}
                </button>
              </th>
              <th className="p-4 text-start w-2/5">
                <div className="font-bold text-[#1F3323] dark:text-white">{reportB.title}</div>
                <button
                  type="button"
                  onClick={() => onOpenReport(reportB.id)}
                  className="text-xs text-[#4B644A] hover:underline font-mono mt-0.5 cursor-pointer"
                >
                  {reportB.referenceNumber}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EBE4] dark:divide-[#223025]">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="p-4 font-semibold text-xs text-[#4A554C] dark:text-[#9DB09F]">
                  {r.label}
                </td>
                <td className="p-4 text-[#172119] dark:text-[#E8EFE9]">{r.valA}</td>
                <td className="p-4 text-[#172119] dark:text-[#E8EFE9]">{r.valB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
