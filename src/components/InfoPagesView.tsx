import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { AppView, Language, UserFeedback } from '../types/medical';
import { generateSafeId } from '../services/fallbackClinicalEngine';

interface InfoPagesViewProps {
  lang: Language;
  view: 'about' | 'help' | 'privacy' | 'terms' | 'disclaimer' | 'feedback';
  userId: string;
  onNavigate: (view: AppView) => void;
  onSubmitFeedback: (feedback: UserFeedback) => Promise<void>;
}

export const InfoPagesView: React.FC<InfoPagesViewProps> = ({
  lang,
  view,
  userId,
  onNavigate,
  onSubmitFeedback,
}) => {
  const isAr = lang === 'ar';
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<UserFeedback['category']>('general');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const subNav: { id: InfoPagesViewProps['view']; label: string }[] = [
    { id: 'about', label: isAr ? 'عن دكتور AI' : 'About Platform' },
    { id: 'help', label: isAr ? 'مركز المساعدة' : 'Help Center' },
    { id: 'privacy', label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy' },
    { id: 'terms', label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions' },
    { id: 'disclaimer', label: isAr ? 'إخلاء المسؤولية الطبية' : 'Medical Disclaimer' },
    { id: 'feedback', label: isAr ? 'تقييم التجربة' : 'Feedback' },
  ];

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await onSubmitFeedback({
      id: generateSafeId('fb'),
      userId,
      rating,
      category,
      comment: comment.trim(),
      localCreatedAt: new Date().toISOString(),
    });
    setComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E3E8E1] dark:border-[#223025] pb-4">
        {subNav.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              view === tab.id
                ? 'bg-[#1F3323] text-white dark:bg-[#4B644A]'
                : 'bg-[#F0F4EE] dark:bg-[#162218] text-[#3B483D] dark:text-[#B5C6B7] hover:bg-[#E2EAE0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] space-y-5 leading-relaxed text-sm sm:text-base text-[#2D382F] dark:text-[#D5E1D7]">
        {view === 'about' && (
          <>
            <h1 className="text-2xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'عن منصة DOCTOR AI | دكتور AI' : 'About DOCTOR AI'}
            </h1>
            <p>
              {isAr
                ? 'دكتور AI منصة مساعدة صحية ذكية تهدف إلى مساعدة المستخدمين على التعبير عن أعراضهم بوضوح وإجراء مقابلة صحية منظمة، ثم تحويل تلك المعلومات إلى تقرير طبي احترافي بمقاس A4 يمكن الاحتفاظ به أو طباعته ومشاركته مع الطبيب المختص.'
                : 'DOCTOR AI is an intelligent health intake assistant designed to help users articulate symptoms through a structured interview and generate a permanent, physician-ready A4 medical report.'}
            </p>
            <p>
              {isAr
                ? 'صُممت المنصة بمبدأ موثوقية البيانات أولًا: كل إجابة تُحفظ فورًا محليًا، وتتوفر تقاريرك للتنزيل والطباعة في جميع الظروف حتى في حال انقطاع الاتصال أو تعذر التحليل الذكي.'
                : 'Built with data resilience first: every response is auto-saved locally, ensuring your report remains accessible, printable, and downloadable as PDF under all network conditions.'}
            </p>
          </>
        )}

        {view === 'help' && (
          <>
            <h1 className="text-2xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'مركز المساعدة' : 'Help Center'}
            </h1>
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-[#1F3323] dark:text-white">
                  {isAr ? 'كيف أبدأ تقييمًا صحيًا؟' : 'How do I start an assessment?'}
                </h2>
                <p className="text-sm text-[#4A554C] dark:text-[#9DB09F]">
                  {isAr
                    ? 'اضغط على زر "ابدأ التقييم الصحي" واكتب أعراضك بحرية أو استخدم زر الميكروفون للإملاء الصوتي. سيسألك المساعد سؤالًا واحدًا في كل مرة.'
                    : 'Click "Start Assessment" and type your symptoms or use voice dictation. The assistant will ask focused follow-up questions one at a time.'}
                </p>
              </div>
              <div>
                <h2 className="font-bold text-[#1F3323] dark:text-white">
                  {isAr ? 'كيف أنزّل التقرير بصيغة PDF أو أطبعه؟' : 'How do I download PDF or print?'}
                </h2>
                <p className="text-sm text-[#4A554C] dark:text-[#9DB09F]">
                  {isAr
                    ? 'بمجرد إدخال أول عرض، تظهر أزرار "عرض التقرير" و"تنزيل التقرير PDF" و"طباعة التقرير" في أعلى المحادثة وفي مكتبة تقاريرك الصحية.'
                    : 'As soon as your first symptom is entered, "View Report", "Download PDF", and "Print Report" buttons remain available in the consultation header and your Reports Library.'}
                </p>
              </div>
              <div>
                <h2 className="font-bold text-[#1F3323] dark:text-white">
                  {isAr ? 'هل يمكنني تعديل إجاباتي السابقة؟' : 'Can I edit previous answers?'}
                </h2>
                <p className="text-sm text-[#4A554C] dark:text-[#9DB09F]">
                  {isAr
                    ? 'نعم، اضغط على زر "تعديل" أسفل أي رسالة أرسلتها لتصحيحها وإعادة تحديث بيانات التقرير تلقائيًا.'
                    : 'Yes, click "Edit" under any of your messages to revise your answer and automatically update the report.'}
                </p>
              </div>
            </div>
          </>
        )}

        {view === 'privacy' && (
          <>
            <h1 className="text-2xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'سياسة الخصوصية وحماية البيانات الصحية' : 'Privacy Policy & Health Data Protection'}
            </h1>
            <p>
              {isAr
                ? 'نلتزم بحماية سرية معلوماتك الصحية. تُحفظ بيانات التقييم محليًا داخل متصفحك في نطاق معزول، وعند اختيارك تسجيل الدخول بحساب Google، تتم مزامنة تقاريرك مع قاعدة البيانات السحابية الخاصة بحسابك فقط مع تطبيق قواعد أمان صارمة تمنع أي مستخدم آخر من الاطلاع على بياناتك.'
                : 'We strictly protect your health privacy. Assessment records are stored locally in an isolated scope and, when signed in with Google, synced privately to your account with user-level access enforcement.'}
            </p>
            <p>
              {isAr
                ? 'يمكنك في أي وقت تصدير نسخة من بياناتك أو حذف أي تقرير فردي أو حذف جميع بياناتك الصحية بالكامل من صفحة الملف الصحي الشخصي.'
                : 'You may export your data, delete individual reports, or erase all health data completely from your Personal Health Profile at any time.'}
            </p>
          </>
        )}

        {view === 'terms' && (
          <>
            <h1 className="text-2xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </h1>
            <p>
              {isAr
                ? 'باستخدامك لمنصة دكتور AI، فإنك تقر بأن المنصة أداة مساعدة معلوماتية لتنظيم الأعراض وإعداد التقارير المرجعية، ولا تقدم استشارة طبية متخصصة أو تشخيصًا سريريًا أو وصفة علاجية.'
                : 'By using DOCTOR AI, you acknowledge that the platform is an informational organization tool and does not provide medical diagnoses, clinical prescriptions, or emergency dispatch services.'}
            </p>
            <p>
              {isAr
                ? 'في الحالات الإسعافية أو الطوارئ الطبية، يجب الاتصال فورًا برقم الطوارئ المحلي أو التوجه لأقرب مستشفى وعدم الاعتماد على أي أداة رقمية.'
                : 'In any medical emergency, immediately contact local emergency services or go to the nearest emergency room.'}
            </p>
          </>
        )}

        {view === 'disclaimer' && (
          <>
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-300">
              {isAr ? 'إخلاء المسؤولية الطبية' : 'Medical Disclaimer'}
            </h1>
            <p>
              {isAr
                ? 'هذا النظام وتقاريره الصادرة عنه تم إنشاؤها بمساعدة الذكاء الاصطناعي لأغراض تنظيم المعلومات والتوعية الصحية فقط، ولا تمثل تشخيصًا طبيًا مؤكدًا ولا تغني بأي حال عن الفحص الطبي المباشر لدى الطبيب المختص.'
                : 'This platform and its generated reports are created with AI assistance for informational organization only, do not constitute a confirmed medical diagnosis, and never replace direct evaluation by a qualified physician.'}
            </p>
            <p className="font-semibold">
              {isAr
                ? 'لا تتجاهل النصيحة الطبية المتخصصة ولا تؤخر طلب الرعاية العاجلة بسبب أي محتوى تقرأه هنا.'
                : 'Never disregard professional medical advice or delay seeking urgent care because of content generated here.'}
            </p>
          </>
        )}

        {view === 'feedback' && (
          <>
            <h1 className="text-2xl font-bold text-[#1F3323] dark:text-white">
              {isAr ? 'تقييم تجربة الاستخدام' : 'Rate Your Experience'}
            </h1>
            <form onSubmit={handleFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2">
                  {isAr ? 'التقييم العام' : 'Overall Rating'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className="p-1.5 rounded-lg hover:bg-[#F0F4EE] dark:hover:bg-[#1A261C] cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          num <= rating
                            ? 'fill-[#4B644A] text-[#4B644A]'
                            : 'text-[#C5CFC3]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {isAr ? 'الجانب' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as UserFeedback['category'])}
                  className="w-full sm:w-64 h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
                >
                  <option value="general">{isAr ? 'تجربة الاستخدام العامة' : 'General Experience'}</option>
                  <option value="accuracy">{isAr ? 'جودة الأسئلة والتحليل' : 'Interview & Analysis'}</option>
                  <option value="pdf">{isAr ? 'التقرير وتنزيل PDF' : 'Report & PDF Export'}</option>
                  <option value="design">{isAr ? 'التصميم والواجهة' : 'Design & UI'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {isAr ? 'ملاحظاتك واقتراحاتك' : 'Your Comments & Suggestions'}
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  placeholder={isAr ? 'شاركنا رأيك لتحسين دكتور AI...' : 'Share your feedback to help us improve DOCTOR AI...'}
                  className="w-full p-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
                />
              </div>

              <button
                type="submit"
                className="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-sm font-semibold cursor-pointer"
              >
                {submitted && <Check className="w-4 h-4" />}
                <span>
                  {submitted
                    ? isAr
                      ? 'تم إرسال تقييمك بنجاح'
                      : 'Feedback Submitted'
                    : isAr
                    ? 'إرسال التقييم'
                    : 'Submit Feedback'}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
