import { AIAnalysisStatus, Language, ReportStatus, UrgencyLevel } from '../types/medical';

export const STATUS_LABELS: Record<ReportStatus, Record<Language, string>> = {
  preliminary: { ar: 'تقرير أولي', en: 'Preliminary Report' },
  partial: { ar: 'تقرير جزئي', en: 'Partial Report' },
  completed: { ar: 'تقرير مكتمل', en: 'Completed Report' },
};

export const AI_STATUS_LABELS: Record<AIAnalysisStatus, Record<Language, string>> = {
  complete: { ar: 'التحليل الذكي مكتمل', en: 'AI Analysis Complete' },
  unavailable: { ar: 'التحليل الذكي غير مكتمل (نسخة منظمة من بياناتك)', en: 'AI Analysis Incomplete (Structured from Saved Data)' },
  pending: { ar: 'بانتظار استكمال التحليل الذكي', en: 'Pending AI Analysis' },
};

export const URGENCY_LABELS: Record<UrgencyLevel, Record<Language, string>> = {
  emergency: { ar: 'طوارئ فورية', en: 'Immediate Emergency' },
  urgent: { ar: 'عاجل — خلال 24 ساعة', en: 'Urgent — Within 24 Hours' },
  soon: { ar: 'قريب — مراجعة طبية قريبة', en: 'Soon — Prompt Clinic Visit' },
  routine: { ar: 'اعتيادي — متابعة ومراقبة', en: 'Routine — Monitor & Follow Up' },
};

export const GENDER_LABELS: Record<string, Record<Language, string>> = {
  male: { ar: 'ذكر', en: 'Male' },
  female: { ar: 'أنثى', en: 'Female' },
  other: { ar: 'أخرى', en: 'Other' },
  '': { ar: 'غير محدد', en: 'Not specified' },
};

export function formatDateTime(iso: string, lang: Language): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
}

export function formatDateOnly(iso: string, lang: Language): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return iso;
  }
}

export const COPY = {
  ar: {
    brandAr: 'دكتور AI',
    brandEn: 'DOCTOR AI',
    tagline: 'Your Intelligent Health Assistant',
    navHome: 'الرئيسية',
    navConsult: 'التقييم الذكي',
    navReports: 'تقاريري الصحية',
    navProfile: 'الملف الصحي',
    navAbout: 'عن المنصة',
    startAssessment: 'ابدأ التقييم الصحي',
    viewReports: 'عرض التقارير السابقة',
    heroTitle: 'صحتك تستحق فهمًا أفضل',
    heroDesc: 'احكيلنا عن الأعراض اللي بتحس بيها، وسنساعدك تفهم حالتك ونجهزلك تقريرًا صحيًا منظمًا.',
    disclaimerShort: 'تنبيه طبي: هذه الخدمة مساعدة معلوماتية ذكية لتنظيم أعراضك، وليست بديلًا عن الفحص الطبي المباشر أو تشخيص الطبيب.',
    backToChat: 'العودة إلى المحادثة',
    viewReport: 'عرض التقرير',
    downloadPdf: 'تنزيل التقرير PDF',
    printReport: 'طباعة التقرير',
    copyReport: 'نسخ التقرير',
    copied: 'تم نسخ التقرير',
    newAssessment: 'تقييم جديد',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    online: 'متصل',
    offline: 'غير متصل بالإنترنت — يتم الحفظ محليًا تلقائيًا',
    savedLocal: 'محفوظ محليًا',
    syncedCloud: 'متزامن سحابيًا',
    pendingSync: 'بانتظار المزامنة السحابية',
    syncError: 'محفوظ محليًا (تعذرت المزامنة السحابية)',
  },
  en: {
    brandAr: 'DOCTOR AI',
    brandEn: 'DOCTOR AI',
    tagline: 'Your Intelligent Health Assistant',
    navHome: 'Home',
    navConsult: 'Smart Assessment',
    navReports: 'My Reports',
    navProfile: 'Health Profile',
    navAbout: 'About & Help',
    startAssessment: 'Start Health Assessment',
    viewReports: 'View Previous Reports',
    heroTitle: 'Your health deserves clearer understanding',
    heroDesc: 'Describe the symptoms you are experiencing, and we will guide you through a structured health interview and prepare an organized medical report.',
    disclaimerShort: 'Medical Notice: This service provides intelligent informational support to organize your symptoms and is not a substitute for direct medical evaluation or physician diagnosis.',
    backToChat: 'Back to Chat',
    viewReport: 'View Report',
    downloadPdf: 'Download PDF',
    printReport: 'Print Report',
    copyReport: 'Copy Report',
    copied: 'Report copied',
    newAssessment: 'New Assessment',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    online: 'Online',
    offline: 'Offline — Auto-saving locally',
    savedLocal: 'Saved locally',
    syncedCloud: 'Synced to cloud',
    pendingSync: 'Pending cloud sync',
    syncError: 'Saved locally (Cloud sync unavailable)',
  },
};
