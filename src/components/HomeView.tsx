import React, { useState } from 'react';
import {
  Activity,
  ChevronDown,
  FileText,
  Lock,
  ShieldAlert,
  Stethoscope,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { AppView, Language } from '../types/medical';
import { COPY } from '../services/i18n';

interface HomeViewProps {
  lang: Language;
  reportsCount: number;
  onStartAssessment: (initialSymptom?: string) => void;
  onNavigate: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lang,
  reportsCount,
  onStartAssessment,
  onNavigate,
}) => {
  const isAr = lang === 'ar';
  const t = COPY[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const quickExamples = isAr
    ? [
        'عندي صداع ودوخة',
        'عندي ألم شديد في البطن',
        'عندي كحة وحرارة',
        'عندي إرهاق مستمر',
        'عندي ألم في الظهر',
      ]
    : [
        'I have a headache and dizziness',
        'I have severe abdominal pain',
        'I have a cough and fever',
        'I feel persistent fatigue',
        'I have lower back pain',
      ];

  const steps = isAr
    ? [
        {
          num: '01.',
          title: 'صف أعراضك بحرية',
          desc: 'اكتب ما تشعر به بأسلوبك الطبيعي أو عبر الإملاء الصوتي، سواء عرضًا واحدًا أو عدة أعراض معًا.',
        },
        {
          num: '02.',
          title: 'مقابلة طبية ذكية سؤالًا بسؤال',
          desc: 'يطرح دكتور AI أسئلة متابعة دقيقة حول البداية والشدة والموقع والتاريخ الصحي دون تكرار أو تعقيد.',
        },
        {
          num: '03.',
          title: 'تحليل منظم وتنبيه فوري للخطر',
          desc: 'ينظم النظام بياناتك ويوضح درجة الاستعجال والاحتمالات الممكنة مع تنبيه فوري عند أي علامات خطورة.',
        },
        {
          num: '04.',
          title: 'تقرير طبي دائم A4 PDF',
          desc: 'احصل على تقرير طبي احترافي محفوظ محليًا وسحابيًا يمكنك عرضه وتنزيله وطباعته في أي وقت حتى دون إنترنت.',
        },
      ]
    : [
        {
          num: '01.',
          title: 'Describe Your Symptoms Freely',
          desc: 'Write what you feel in natural language or via voice dictation, whether one symptom or several.',
        },
        {
          num: '02.',
          title: 'Step-by-Step Clinical Interview',
          desc: 'DOCTOR AI asks focused follow-up questions about onset, location, severity, and medical history without repetition.',
        },
        {
          num: '03.',
          title: 'Structured Triage & Safety Alerts',
          desc: 'Organizes clinical details, urgency guidance, and non-diagnostic possibilities while flagging emergencies immediately.',
        },
        {
          num: '04.',
          title: 'Permanent A4 PDF Medical Report',
          desc: 'Receive a formal medical dossier saved locally and to your account—viewable, downloadable, and printable anytime.',
        },
      ];

  const faqs = isAr
    ? [
        {
          q: 'هل يغني دكتور AI عن زيارة الطبيب؟',
          a: 'لا. دكتور AI أداة مساعدة معلوماتية ذكية تساعدك على فهم أعراضك وتنظيم تاريخك الصحي في تقرير احترافي تعرضه على طبيبك، ولا يقدم تشخيصًا طبيًا قطعيًا ولا يصف جرعات دوائية.',
        },
        {
          q: 'ماذا يحدث إذا انقطع الإنترنت أو تعطل الذكاء الاصطناعي أثناء المحادثة؟',
          a: 'تم تصميم النظام بنظام حفظ محلي فوري ومحرك احتياطي مستقل؛ لا تفقد إجاباتك أبدًا ويمكنك استخراج تقرير أولي أو جزئي منظم وتنزيله بصيغة PDF والطباعة في جميع الظروف.',
        },
        {
          q: 'كيف تتم حماية خصوصية بياناتي وتقاريري الصحية؟',
          a: 'تُحفظ تقاريرك في مساحة معزولة تمامًا خاصة بك محليًا، وعند تسجيل الدخول تُربط بحسابك فقط بقواعد أمان صارمة تمنع أي مستخدم آخر من الوصول إليها، كما يمكنك حذف جميع بياناتك في أي وقت.',
        },
        {
          q: 'هل يدعم التقرير الطباعة الاحترافية وتنزيل PDF على الهاتف والكمبيوتر؟',
          a: 'نعم، تم تصميم ورقة التقرير بمقاس A4 رسمي باللغة العربية واتجاه RTL كامل مع ترقيم الصفحات وخلفية بيضاء موفرة للحبر، ويعمل التصدير والطباعة على متصفحات الكمبيوتر والهواتف بما فيها Android.',
        },
      ]
    : [
        {
          q: 'Does DOCTOR AI replace seeing a physician?',
          a: 'No. DOCTOR AI is an intelligent informational assistant that helps organize your symptoms into a structured report for your physician. It does not issue definitive diagnoses or prescribe medication dosages.',
        },
        {
          q: 'What happens if my internet disconnects or AI fails during an assessment?',
          a: 'Every response is auto-saved locally in real time, and our independent clinical fallback ensures you can always view, download as PDF, and print a structured preliminary or partial report.',
        },
        {
          q: 'How is my medical privacy protected?',
          a: 'Reports are stored in an isolated scope locally and, when signed in, protected by strict user-level security rules so no other account can access your records. You can delete all your data anytime.',
        },
        {
          q: 'Does the report support A4 PDF export and printing on mobile and desktop?',
          a: 'Yes. Reports render in true A4 dimensions with full RTL/LTR support, crisp typography, page numbering, and ink-friendly black-and-white print compatibility across desktop and mobile browsers.',
        },
      ];

  return (
    <div className="bg-[#FAFBF9] dark:bg-[#0D140F] text-[#172119] dark:text-[#E8EFE9]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="text-xs font-medium text-[#4B644A] dark:text-[#8FB390] tracking-wide">
              DOCTOR AI · {t.tagline}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.2] text-[#1F3323] dark:text-white [text-wrap:balance]">
              {t.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-[#4A554C] dark:text-[#A9B9AB] leading-relaxed max-w-xl">
              {t.heroDesc}
            </p>

            {/* Primary CTA + Secondary Action */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onStartAssessment()}
                className="h-12 px-6 inline-flex items-center gap-2.5 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] dark:hover:bg-[#5B7A5A] text-white text-sm sm:text-base font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t.startAssessment}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="h-12 px-5 inline-flex items-center gap-2 rounded-xl border border-[#CED7CC] dark:border-[#28392B] bg-white dark:bg-[#131D15] hover:bg-[#F3F6F1] dark:hover:bg-[#19261C] text-[#1F3323] dark:text-[#E8EFE9] text-sm sm:text-base font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#4B644A]" />
                <span>{t.viewReports}</span>
                {reportsCount > 0 && (
                  <span className="text-xs text-[#4B644A] dark:text-[#98B999] tabular-nums">
                    ({reportsCount})
                  </span>
                )}
              </button>
            </div>

            {/* Quick-start symptom prompts */}
            <div className="pt-2">
              <p className="text-xs font-medium text-[#5C6B5E] dark:text-[#8FA392] mb-2.5">
                {isAr ? 'ابدأ سريعًا بوصف أحد الأعراض الشائعة:' : 'Quick start with a common symptom:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => onStartAssessment(example)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F0F4EE] dark:bg-[#17231A] hover:bg-[#E2EAE0] dark:hover:bg-[#1F2E22] text-[#2B3D2E] dark:text-[#CFE0D1] border border-[#DCE4DA] dark:border-[#253528] transition-colors cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Medical Disclaimer */}
            <div className="p-4 rounded-xl bg-[#F4F6F3] dark:bg-[#131C15] border border-[#E0E6DE] dark:border-[#223025] flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#4B644A] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-[#3F4D41] dark:text-[#B4C4B6] leading-relaxed">
                {t.disclaimerShort}
              </p>
            </div>
          </div>

          {/* Right Editorial Visual */}
          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-2xl overflow-hidden border border-[#DFE5DD] dark:border-[#223025] bg-[#EFF3EE] dark:bg-[#141F16] flex items-center justify-center min-h-[320px] lg:min-h-[460px]">
              {!imgErrors.hero ? (
                <img
                  src="/src/assets/images/hero_medical_sanctuary_1794680420266.jpg"
                  alt={isAr ? 'بيئة استشارة طبية حديثة وهادئة في دكتور AI' : 'Modern calm medical consultation sanctuary'}
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrors((p) => ({ ...p, hero: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-10 text-center space-y-3">
                  <Stethoscope className="w-12 h-12 text-[#4B644A] mx-auto" />
                  <p className="text-sm font-medium text-[#2C432F] dark:text-[#CFE0D1]">
                    DOCTOR AI · Your Intelligent Health Assistant
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How DOCTOR AI Works */}
      <section className="border-t border-[#E5EAE3] dark:border-[#1D291F] bg-white dark:bg-[#101812] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F3323] dark:text-white mb-3">
              {isAr ? 'كيف يعمل دكتور AI؟' : 'How DOCTOR AI Works'}
            </h2>
            <p className="text-sm sm:text-base text-[#4A554C] dark:text-[#9DB09F]">
              {isAr
                ? 'أربع خطوات واضحة تحوّل وصفك للأعراض إلى ملف طبي منظم جاهز للطبيب.'
                : 'Four structured steps that turn your symptom description into a physician-ready dossier.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-xl bg-[#FAFBF9] dark:bg-[#141F17] border border-[#E3E8E1] dark:border-[#223025] space-y-3"
              >
                <div className="text-sm font-mono font-semibold text-[#4B644A] dark:text-[#92B593] tabular-nums">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-[#1F3323] dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Asymmetric Bento Showcase */}
      <section className="border-t border-[#E5EAE3] dark:border-[#1D291F] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F3323] dark:text-white mb-3">
              {isAr ? 'مميزات مصممة لسلامتك واستمرارية بياناتك' : 'Built for Clinical Clarity & Data Resilience'}
            </h2>
            <p className="text-sm sm:text-base text-[#4A554C] dark:text-[#9DB09F]">
              {isAr
                ? 'تقارير دائمة لا تتوقف على اتصال الإنترنت، ومعايير أمان تحافظ على خصوصيتك.'
                : 'Permanent reports that never fail when connections drop, backed by strict privacy controls.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Marquee Feature Card with Report Image */}
            <div className="lg:col-span-7 rounded-2xl border border-[#DFE5DD] dark:border-[#223025] bg-white dark:bg-[#121C14] overflow-hidden flex flex-col">
              <div className="h-64 sm:h-72 bg-[#EFF3EE] dark:bg-[#162218] overflow-hidden">
                {!imgErrors.report ? (
                  <img
                    src="/src/assets/images/report_dossier_showcase_1794680420729.jpg"
                    alt={isAr ? 'نموذج تقرير طبي احترافي A4' : 'A4 medical report dossier showcase'}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors((p) => ({ ...p, report: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-[#4B644A]" />
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1F3323] dark:text-white">
                    {isAr ? 'التقرير الطبي الدائم بمقاس A4 حقيقي' : 'Permanent A4 Medical Report System'}
                  </h3>
                  <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                    {isAr
                      ? 'يُحفظ كل تفصيل تدخله لحظيًا في متصفحك وقاعدة بياناتك. حتى عند انقطاع الإنترنت أو تعطل خدمة الذكاء الاصطناعي، يظل بإمكانك عرض تقريرك الأولي أو الجزئي وتنزيله بصيغة PDF وطباعته فورًا.'
                      : 'Every answer is saved immediately to local storage and synced to your account. Even offline or during AI downtime, your report remains viewable, downloadable as PDF, and printable.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onStartAssessment()}
                    className="text-sm font-semibold text-[#1F3323] dark:text-[#98B999] hover:underline cursor-pointer"
                  >
                    {isAr ? 'جرّب إنشاء تقريرك الآن ←' : 'Create your report now →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Stacked Features */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex-1 p-6 rounded-2xl border border-[#DFE5DD] dark:border-[#223025] bg-white dark:bg-[#121C14] space-y-3">
                <Activity className="w-6 h-6 text-[#4B644A]" />
                <h3 className="text-lg font-bold text-[#1F3323] dark:text-white">
                  {isAr ? 'رصد فوري لعلامات الخطر' : 'Immediate Red-Flag Detection'}
                </h3>
                <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                  {isAr
                    ? 'إذا ذكرت أعراضًا خطيرة مثل ألم الصدر أو ضيق التنفس الشديد أو فقدان الوعي، يظهر تنبيه طوارئ واضح فورًا دون انتظار انتهاء المحادثة.'
                    : 'Mentioning urgent red flags like chest pain or severe shortness of breath triggers immediate emergency guidance without waiting to complete the interview.'}
                </p>
              </div>

              <div className="flex-1 rounded-2xl border border-[#DFE5DD] dark:border-[#223025] bg-white dark:bg-[#121C14] overflow-hidden grid grid-cols-1 sm:grid-cols-5">
                <div className="sm:col-span-2 bg-[#EFF3EE] dark:bg-[#162218] min-h-[140px]">
                  {!imgErrors.privacy ? (
                    <img
                      src="/src/assets/images/privacy_clinic_interior_1794680420260.jpg"
                      alt={isAr ? 'خصوصية البيانات الصحية' : 'Medical privacy sanctuary'}
                      referrerPolicy="no-referrer"
                      onError={() => setImgErrors((p) => ({ ...p, privacy: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Lock className="w-8 h-8 text-[#4B644A]" />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-3 p-5 space-y-2 flex flex-col justify-center">
                  <h3 className="text-base font-bold text-[#1F3323] dark:text-white">
                    {isAr ? 'خصوصية معزولة وملف صحي شخصي' : 'Isolated Privacy & Health Profile'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                    {isAr
                      ? 'احفظ أمراضك المزمنة وأدويتك وحساسيتك مرة واحدة، وقارن بين تقييمين سابقين مع إمكانية حذف بياناتك بالكامل.'
                      : 'Store chronic conditions, medications, and allergies once, compare past assessments, and delete your data anytime.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-[#E5EAE3] dark:border-[#1D291F] bg-white dark:bg-[#101812] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1F3323] dark:text-white mb-8">
            {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>

          <div className="divide-y divide-[#E3E8E1] dark:divide-[#223025] border-y border-[#E3E8E1] dark:border-[#223025]">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-start py-1 cursor-pointer"
                  >
                    <span className="text-base font-semibold text-[#1F3323] dark:text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#4B644A] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E3E8E1] dark:border-[#1D291F] bg-[#FAFBF9] dark:bg-[#0D140F] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-base font-bold text-[#1F3323] dark:text-white">
              DOCTOR AI | دكتور AI
            </div>
            <p className="text-xs text-[#5C6B5E] dark:text-[#8FA392] mt-1">
              Your Intelligent Health Assistant · {isAr ? 'خدمة معلوماتية وليست بديلًا عن الطبيب' : 'Informational assistant, not a substitute for a physician'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-[#4A554C] dark:text-[#9DB09F]">
            <button type="button" onClick={() => onNavigate('about')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'عن المنصة' : 'About'}
            </button>
            <button type="button" onClick={() => onNavigate('help')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'مركز المساعدة' : 'Help Center'}
            </button>
            <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </button>
            <button type="button" onClick={() => onNavigate('terms')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'الشروط والأحكام' : 'Terms'}
            </button>
            <button type="button" onClick={() => onNavigate('disclaimer')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'إخلاء المسؤولية الطبية' : 'Medical Disclaimer'}
            </button>
            <button type="button" onClick={() => onNavigate('feedback')} className="hover:text-[#1F3323] dark:hover:text-white cursor-pointer">
              {isAr ? 'تقييم التجربة' : 'Feedback'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
