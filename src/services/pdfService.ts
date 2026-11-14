import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  AI_STATUS_LABELS,
  formatDateOnly,
  formatDateTime,
  GENDER_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from './i18n';
import { buildFallbackAnalysis } from './fallbackClinicalEngine';
import { Language, MedicalReport } from '../types/medical';

export function formatReportAsText(report: MedicalReport, lang: Language): string {
  const isAr = lang === 'ar';
  const analysis = report.aiAnalysis || buildFallbackAnalysis(report, lang);
  const statusText = STATUS_LABELS[report.status][lang];
  const aiStatusText = AI_STATUS_LABELS[report.aiAnalysisStatus][lang];
  const urgencyText = URGENCY_LABELS[analysis.urgencyLevel][lang];
  const genderText = GENDER_LABELS[report.patientSnapshot?.gender || ''][lang];

  const lines: string[] = [
    `DOCTOR AI | دكتور AI — ${isAr ? 'التقرير الصحي للمستخدم' : 'User Health Report'}`,
    `==================================================`,
    `${isAr ? 'الرقم المرجعي' : 'Reference No'}: ${report.referenceNumber}`,
    `${isAr ? 'تاريخ ووقت الإنشاء' : 'Generated At'}: ${formatDateTime(report.localCreatedAt, lang)}`,
    `${isAr ? 'حالة التقرير' : 'Report Status'}: ${statusText}`,
    `${isAr ? 'حالة التحليل الذكي' : 'AI Analysis Status'}: ${aiStatusText}`,
    ``,
    `1. ${isAr ? 'بيانات المستخدم' : 'User Information'}`,
    `- ${isAr ? 'العمر' : 'Age'}: ${report.patientSnapshot?.age || (isAr ? 'غير متوفر' : 'Not provided')}`,
    `- ${isAr ? 'الجنس' : 'Gender'}: ${genderText}`,
    `- ${isAr ? 'تاريخ التقييم' : 'Assessment Date'}: ${formatDateOnly(report.localUpdatedAt, lang)}`,
    ``,
    `2. ${isAr ? 'الشكوى الرئيسية' : 'Chief Complaint'}`,
    `${report.collectedData.chiefComplaint || (isAr ? 'لم تُذكر شكوى محددة بعد.' : 'Not specified yet.')}`,
    ``,
    `3. ${isAr ? 'تفاصيل الأعراض' : 'Symptom Details'}`,
    `- ${isAr ? 'الأعراض المذكورة' : 'Reported Symptoms'}: ${report.collectedData.symptoms.join('، ') || (isAr ? 'غير متوفر' : 'Not provided')}`,
    `- ${isAr ? 'مكان الألم' : 'Location'}: ${report.collectedData.painLocation || (isAr ? 'غير محدد' : 'Not specified')}`,
    `- ${isAr ? 'وقت البداية' : 'Onset'}: ${report.collectedData.onsetTime || (isAr ? 'غير محدد' : 'Not specified')}`,
    `- ${isAr ? 'المدة' : 'Duration'}: ${report.collectedData.duration || (isAr ? 'غير محدد' : 'Not specified')}`,
    `- ${isAr ? 'شدة الألم' : 'Severity'}: ${report.collectedData.severity || (isAr ? 'غير محدد' : 'Not specified')}`,
    `- ${isAr ? 'النمط' : 'Pattern'}: ${report.collectedData.pattern || (isAr ? 'غير محدد' : 'Not specified')}`,
    ``,
    `4. ${isAr ? 'التاريخ الصحي' : 'Medical History'}`,
    `- ${isAr ? 'الأمراض المزمنة' : 'Chronic Conditions'}: ${report.collectedData.chronicConditions.join('، ') || (isAr ? 'غير مذكورة' : 'None reported')}`,
    `- ${isAr ? 'الأدوية الحالية' : 'Current Medications'}: ${report.collectedData.currentMedications.join('، ') || (isAr ? 'غير مذكورة' : 'None reported')}`,
    `- ${isAr ? 'الحساسية' : 'Allergies'}: ${report.collectedData.allergies.join('، ') || (isAr ? 'غير مذكورة' : 'None reported')}`,
    `- ${isAr ? 'التاريخ الطبي السابق' : 'Past Medical History'}: ${report.collectedData.medicalHistory || (isAr ? 'غير مذكور' : 'None reported')}`,
    ``,
    `5. ${isAr ? 'التحليل الصحي' : 'Health Analysis'}`,
    `${analysis.organizedSummary}`,
    `- ${isAr ? 'درجة الاستعجال' : 'Urgency Level'}: ${urgencyText} — ${analysis.urgencyExplanation}`,
  ];

  if (analysis.possibleConsiderations.length > 0) {
    lines.push(`${isAr ? 'الاحتمالات التي تستحق التقييم الطبي' : 'Possibilities Worth Clinical Evaluation'}:`);
    for (const item of analysis.possibleConsiderations) {
      lines.push(`  * ${item.condition}: ${item.reasoning} (${item.likelihoodNote})`);
    }
  }

  if (analysis.missingInformation.length > 0) {
    lines.push(`${isAr ? 'المعلومات الناقصة' : 'Missing Information'}:`);
    for (const m of analysis.missingInformation) lines.push(`  * ${m}`);
  }

  lines.push(``, `6. ${isAr ? 'التوصيات والسلامة' : 'Recommendations & Safety'}`);
  lines.push(`${isAr ? 'إرشادات عامة آمنة' : 'Safe General Guidance'}:`);
  for (const g of analysis.safeGuidance) lines.push(`  * ${g}`);
  lines.push(`${isAr ? 'متى يجب مراجعة الطبيب' : 'When to See a Doctor'}:`);
  for (const d of analysis.whenToSeeDoctor) lines.push(`  * ${d}`);
  lines.push(`${isAr ? 'متى يجب التوجه للطوارئ فورًا' : 'When to Seek Emergency Care'}:`);
  for (const e of analysis.whenToSeekEmergency) lines.push(`  * ${e}`);

  if (report.collectedData.notes) {
    lines.push(``, `7. ${isAr ? 'ملاحظات إضافية' : 'Additional Notes'}`, report.collectedData.notes);
  }

  lines.push(
    ``,
    `--------------------------------------------------`,
    isAr
      ? 'التنبيه الطبي: هذا التقرير تم إنشاؤه بمساعدة الذكاء الاصطناعي ولا يمثل تشخيصًا طبيًا مؤكدًا ولا يغني عن الفحص الطبي المباشر.'
      : 'Medical Disclaimer: This report was generated with AI assistance and does not represent a confirmed medical diagnosis or replace direct physician evaluation.',
    `DOCTOR AI — Your Intelligent Health Assistant.`
  );

  return lines.join('\n');
}

export async function generateA4ReportPDF(
  sourceElement: HTMLElement,
  report: MedicalReport,
  lang: Language
): Promise<void> {
  if (typeof document === 'undefined') return;

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const isAr = lang === 'ar';
  const PAGE_WIDTH_PX = 794; // 210mm at 96dpi
  const PAGE_HEIGHT_PX = 1123; // 297mm at 96dpi
  const CONTENT_BUDGET_PX = 910; // Leaves generous header, footer & margins

  // Build offscreen staging host with strict hex colors (no oklch)
  const stagingRoot = document.createElement('div');
  stagingRoot.style.position = 'fixed';
  stagingRoot.style.left = '-99999px';
  stagingRoot.style.top = '0';
  stagingRoot.style.width = `${PAGE_WIDTH_PX}px`;
  stagingRoot.style.background = '#ffffff';
  stagingRoot.style.color = '#111827';
  stagingRoot.style.direction = isAr ? 'rtl' : 'ltr';
  stagingRoot.style.fontFamily = '"IBM Plex Sans Arabic", "Cairo", sans-serif';
  stagingRoot.style.zIndex = '-1';
  document.body.appendChild(stagingRoot);

  try {
    const blocks = Array.from(sourceElement.querySelectorAll('.a4-pdf-block')) as HTMLElement[];
    const headerNode = sourceElement.querySelector('.a4-pdf-header') as HTMLElement | null;

    // Group blocks into discrete A4 pages without cutting any block mid-way
    const pages: HTMLElement[][] = [[]];
    let currentHeight = headerNode ? headerNode.offsetHeight + 24 : 130;

    for (const block of blocks) {
      const clone = block.cloneNode(true) as HTMLElement;
      stagingRoot.appendChild(clone);
      const measuredH = clone.offsetHeight + 14;
      stagingRoot.removeChild(clone);

      if (pages[pages.length - 1].length > 0 && currentHeight + measuredH > CONTENT_BUDGET_PX) {
        pages.push([block]);
        currentHeight = 56 + measuredH; // subsequent page running header height
      } else {
        pages[pages.length - 1].push(block);
        currentHeight += measuredH;
      }
    }

    const totalPages = pages.length;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageEl = document.createElement('div');
      pageEl.style.width = `${PAGE_WIDTH_PX}px`;
      pageEl.style.height = `${PAGE_HEIGHT_PX}px`;
      pageEl.style.backgroundColor = '#ffffff';
      pageEl.style.color = '#111827';
      pageEl.style.padding = '40px 44px 36px 44px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';
      pageEl.style.direction = isAr ? 'rtl' : 'ltr';
      pageEl.style.fontFamily = '"IBM Plex Sans Arabic", "Cairo", sans-serif';

      const bodyWrapper = document.createElement('div');
      bodyWrapper.style.display = 'flex';
      bodyWrapper.style.flexDirection = 'column';
      bodyWrapper.style.gap = '12px';

      if (pageIdx === 0 && headerNode) {
        bodyWrapper.appendChild(headerNode.cloneNode(true));
      } else {
        const runningHeader = document.createElement('div');
        runningHeader.style.display = 'flex';
        runningHeader.style.justifyContent = 'space-between';
        runningHeader.style.alignItems = 'center';
        runningHeader.style.paddingBottom = '8px';
        runningHeader.style.marginBottom = '4px';
        runningHeader.style.borderBottom = '1px solid #d1d9cf';
        runningHeader.style.fontSize = '11px';
        runningHeader.style.color = '#4b644a';
        runningHeader.innerHTML = `
          <span style="font-weight:700;">DOCTOR AI | دكتور AI — ${isAr ? 'التقرير الصحي للمستخدم' : 'User Health Report'}</span>
          <span style="font-family:monospace;">${report.referenceNumber}</span>
        `;
        bodyWrapper.appendChild(runningHeader);
      }

      for (const blk of pages[pageIdx]) {
        bodyWrapper.appendChild(blk.cloneNode(true));
      }

      const footerEl = document.createElement('div');
      footerEl.style.borderTop = '1px solid #d1d9cf';
      footerEl.style.paddingTop = '10px';
      footerEl.style.display = 'flex';
      footerEl.style.justifyContent = 'space-between';
      footerEl.style.alignItems = 'center';
      footerEl.style.fontSize = '10px';
      footerEl.style.color = '#475569';
      footerEl.innerHTML = `
        <span>DOCTOR AI · Your Intelligent Health Assistant</span>
        <span>${isAr ? `صفحة ${pageIdx + 1} من ${totalPages}` : `Page ${pageIdx + 1} of ${totalPages}`}</span>
      `;

      pageEl.appendChild(bodyWrapper);
      pageEl.appendChild(footerEl);
      stagingRoot.innerHTML = '';
      stagingRoot.appendChild(pageEl);

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.94);
      if (pageIdx > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    const fileName = `DOCTOR-AI-Report-${report.referenceNumber}.pdf`;
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } finally {
    if (stagingRoot.parentNode) {
      stagingRoot.parentNode.removeChild(stagingRoot);
    }
  }
}
