import React from 'react';
import {
  AI_STATUS_LABELS,
  formatDateOnly,
  formatDateTime,
  GENDER_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '../services/i18n';
import { buildFallbackAnalysis } from '../services/fallbackClinicalEngine';
import { Language, MedicalReport } from '../types/medical';

interface A4MedicalReportSheetProps {
  report: MedicalReport;
  lang: Language;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const A4MedicalReportSheet: React.FC<A4MedicalReportSheetProps> = ({
  report,
  lang,
  sheetRef,
}) => {
  const isAr = lang === 'ar';
  const analysis = report.aiAnalysis || buildFallbackAnalysis(report, lang);
  const statusLabel = STATUS_LABELS[report.status][lang];
  const aiStatusLabel = AI_STATUS_LABELS[report.aiAnalysisStatus][lang];
  const urgencyLabel = URGENCY_LABELS[analysis.urgencyLevel][lang];
  const genderLabel = GENDER_LABELS[report.patientSnapshot?.gender || ''][lang];

  const { collectedData } = report;

  const urgencyColors: Record<string, { border: string; text: string; bg: string }> = {
    emergency: { border: '#991B1B', text: '#7F1D1D', bg: '#FEF2F2' },
    urgent: { border: '#B45309', text: '#78350F', bg: '#FFFBEB' },
    soon: { border: '#4B644A', text: '#1F3323', bg: '#F4F7F4' },
    routine: { border: '#475569', text: '#1E293B', bg: '#F8FAFC' },
  };
  const urgStyle = urgencyColors[analysis.urgencyLevel] || urgencyColors.soon;

  const notProvided = isAr ? 'غير متوفر' : 'Not provided';

  return (
    <div
      ref={sheetRef}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: '#FFFFFF',
        color: '#111827',
        fontFamily: '"IBM Plex Sans Arabic", "Cairo", sans-serif',
      }}
      className="print-only-container w-full max-w-[794px] mx-auto bg-white border border-[#D8DFD5] shadow-sm px-6 py-8 md:px-11 md:py-10 text-[#111827]"
    >
      {/* 1. Report Header */}
      <div
        className="a4-pdf-header a4-section-block"
        style={{
          borderBottom: '2px solid #2C432F',
          paddingBottom: '16px',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="6" fill="#2C432F" />
                <path
                  d="M16 7V25M7 16H25"
                  stroke="#FFFFFF"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1F3323',
                    letterSpacing: '0.02em',
                  }}
                >
                  DOCTOR AI | دكتور AI
                </div>
                <div style={{ fontSize: '11px', color: '#4B644A' }}>
                  Your Intelligent Health Assistant
                </div>
              </div>
            </div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
                marginTop: '12px',
              }}
            >
              {isAr ? 'التقرير الصحي للمستخدم' : 'User Health Assessment Report'}
            </h1>
          </div>

          <div
            style={{
              textAlign: isAr ? 'left' : 'right',
              fontSize: '12px',
              color: '#374151',
              lineHeight: 1.7,
            }}
          >
            <div>
              <span style={{ color: '#6B7280' }}>
                {isAr ? 'رقم التقرير المرجعي:' : 'Report Reference:'}{' '}
              </span>
              <strong style={{ fontFamily: 'monospace', color: '#111827' }}>
                {report.referenceNumber}
              </strong>
            </div>
            <div>
              <span style={{ color: '#6B7280' }}>
                {isAr ? 'تاريخ ووقت الإنشاء:' : 'Created:'}{' '}
              </span>
              <span>{formatDateTime(report.localCreatedAt, lang)}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280' }}>
                {isAr ? 'حالة التقرير:' : 'Report Status:'}{' '}
              </span>
              <strong style={{ color: '#2C432F' }}>{statusLabel}</strong>
            </div>
          </div>
        </div>

        {report.aiAnalysisStatus !== 'complete' && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              border: '1px solid #D97706',
              backgroundColor: '#FFFBEB',
              color: '#78350F',
              fontSize: '12px',
              borderRadius: '4px',
            }}
          >
            <strong>{isAr ? 'ملاحظة الحالة:' : 'Status Note:'}</strong> {aiStatusLabel}
          </div>
        )}
      </div>

      {/* 2. User Demographics & Metadata Table */}
      <div
        className="a4-pdf-block a4-section-block"
        style={{ marginBottom: '16px' }}
      >
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '1. بيانات المستخدم والملف المرجعي' : '1. User & Reference Details'}
        </h2>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', width: '22%', fontWeight: 600 }}>
                {isAr ? 'العمر' : 'Age'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', width: '28%' }}>
                {report.patientSnapshot?.age || notProvided}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', width: '22%', fontWeight: 600 }}>
                {isAr ? 'الجنس' : 'Gender'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', width: '28%' }}>
                {genderLabel}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'تاريخ التقييم' : 'Assessment Date'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {formatDateOnly(report.localUpdatedAt, lang)}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'الرقم المرجعي' : 'Reference ID'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', fontFamily: 'monospace' }}>
                {report.referenceNumber}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Chief Complaint */}
      <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '2. الشكوى الرئيسية' : '2. Chief Complaint'}
        </h2>
        <p style={{ fontSize: '13px', lineHeight: 1.75, color: '#1F2937', margin: 0 }}>
          {collectedData.chiefComplaint ||
            (isAr ? 'لم يتم تسجيل شكوى رئيسية محددة حتى الآن.' : 'No specific chief complaint recorded yet.')}
        </p>
      </div>

      {/* 4. Symptom Details Table */}
      <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '3. تفاصيل الأعراض' : '3. Symptom Details'}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', width: '28%', fontWeight: 600 }}>
                {isAr ? 'مكان الألم / الانزعاج' : 'Pain / Discomfort Location'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.painLocation || notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'وقت البداية' : 'Onset Time'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.onsetTime || notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'مدة الأعراض' : 'Duration'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.duration || notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'شدة الألم / الأعراض' : 'Severity'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.severity || notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'نمط الأعراض' : 'Pattern'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.pattern || notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'الأعراض المصاحبة' : 'Associated Symptoms'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.associatedSymptoms.length > 0
                  ? collectedData.associatedSymptoms.join('، ')
                  : collectedData.symptoms.length > 1
                  ? collectedData.symptoms.join('، ')
                  : notProvided}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Medical History */}
      <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '4. التاريخ الصحي' : '4. Medical History'}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', width: '28%', fontWeight: 600 }}>
                {isAr ? 'الأمراض المزمنة' : 'Chronic Conditions'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.chronicConditions.length > 0
                  ? collectedData.chronicConditions.join('، ')
                  : notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'الأدوية الحالية' : 'Current Medications'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.currentMedications.length > 0
                  ? collectedData.currentMedications.join('، ')
                  : notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'الحساسية' : 'Allergies'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.allergies.length > 0
                  ? collectedData.allergies.join('، ')
                  : notProvided}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAF8', fontWeight: 600 }}>
                {isAr ? 'التاريخ الطبي السابق' : 'Past Medical History'}
              </td>
              <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>
                {collectedData.medicalHistory || notProvided}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Health Analysis */}
      <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '5. التحليل الصحي المنظم' : '5. Organized Health Analysis'}
        </h2>

        <div
          style={{
            padding: '10px 12px',
            border: `1px solid ${urgStyle.border}`,
            backgroundColor: urgStyle.bg,
            color: urgStyle.text,
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>
            {isAr ? 'درجة الاستعجال:' : 'Urgency Level:'} {urgencyLabel}
          </div>
          <div>{analysis.urgencyExplanation}</div>
        </div>

        <p style={{ fontSize: '12.5px', lineHeight: 1.75, color: '#1F2937', marginBottom: '10px' }}>
          {analysis.organizedSummary}
        </p>

        {analysis.possibleConsiderations.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F3323', marginBottom: '6px' }}>
              {isAr ? 'الاحتمالات الطبية التي تستحق التقييم (غير جازمة):' : 'Considerations Worth Clinical Evaluation (Non-Diagnostic):'}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F6F3' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #E5E7EB', textAlign: isAr ? 'right' : 'left' }}>
                    {isAr ? 'الاحتمال' : 'Possibility'}
                  </th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E5E7EB', textAlign: isAr ? 'right' : 'left' }}>
                    {isAr ? 'الأساس المذكور' : 'Basis'}
                  </th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E5E7EB', textAlign: isAr ? 'right' : 'left' }}>
                    {isAr ? 'ملاحظة التقييم' : 'Evaluation Note'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.possibleConsiderations.map((c, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB', fontWeight: 600 }}>
                      {c.condition}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>{c.reasoning}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E5E7EB' }}>{c.likelihoodNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {analysis.missingInformation.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
              {isAr ? 'المعلومات الناقصة التي يُنصح باستكمالها مع الطبيب:' : 'Missing Information to Clarify with a Physician:'}
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '18px', fontSize: '12px', lineHeight: 1.7, color: '#374151' }}>
              {analysis.missingInformation.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 7. Recommendations */}
      <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#2C432F',
            borderBottom: '1px solid #D1D9CF',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}
        >
          {isAr ? '6. التوصيات وعلامات المراجعة' : '6. Safe Guidance & Warning Signs'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1F3323', marginBottom: '4px' }}>
              {isAr ? 'إرشادات عامة آمنة:' : 'Safe General Guidance:'}
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.7 }}>
              {analysis.safeGuidance.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#1F3323', marginBottom: '4px' }}>
              {isAr ? 'متى يجب مراجعة الطبيب:' : 'When to See a Doctor:'}
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.7 }}>
              {analysis.whenToSeeDoctor.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: '8px 12px',
              border: '1px solid #FCA5A5',
              backgroundColor: '#FEF2F2',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
              {isAr ? 'متى يجب التوجه للطوارئ فورًا:' : 'When to Seek Immediate Emergency Care:'}
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '18px', lineHeight: 1.7, color: '#7F1D1D' }}>
              {analysis.whenToSeekEmergency.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 8. Additional Notes */}
      {collectedData.notes && (
        <div className="a4-pdf-block a4-section-block" style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#2C432F',
              borderBottom: '1px solid #D1D9CF',
              paddingBottom: '4px',
              marginBottom: '8px',
            }}
          >
            {isAr ? '7. ملاحظات إضافية' : '7. Additional Notes'}
          </h2>
          <p style={{ fontSize: '12px', lineHeight: 1.7, margin: 0 }}>{collectedData.notes}</p>
        </div>
      )}

      {/* 9. Medical Disclaimer & Signature */}
      <div
        className="a4-pdf-block a4-section-block"
        style={{
          borderTop: '1.5px solid #2C432F',
          paddingTop: '12px',
          marginTop: '14px',
          fontSize: '11.5px',
          color: '#374151',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#F9FAF8',
            border: '1px solid #D8DFD5',
            borderRadius: '4px',
            marginBottom: '12px',
            lineHeight: 1.7,
          }}
        >
          <strong>{isAr ? 'التنبيه الطبي:' : 'Medical Disclaimer:'} </strong>
          {isAr
            ? 'هذا التقرير تم إنشاؤه بمساعدة الذكاء الاصطناعي ولا يمثل تشخيصًا طبيًا مؤكدًا ولا يغني عن الفحص الطبي المباشر.'
            : 'This report was generated with AI assistance and does not constitute a confirmed medical diagnosis nor replace direct medical examination.'}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#4B644A',
          }}
        >
          <div>
            <strong style={{ color: '#1F3323' }}>DOCTOR AI</strong> · Your Intelligent Health Assistant.
          </div>
          <div style={{ fontFamily: 'monospace' }}>{report.referenceNumber}</div>
        </div>
      </div>
    </div>
  );
};
