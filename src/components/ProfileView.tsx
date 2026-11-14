import React, { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Check, Download, LogIn, LogOut, Shield, Trash2 } from 'lucide-react';
import { HealthProfile, Language, MedicalReport } from '../types/medical';

interface ProfileViewProps {
  lang: Language;
  user: FirebaseUser | null;
  profile: HealthProfile;
  reports: MedicalReport[];
  onSaveProfile: (updated: HealthProfile) => Promise<void>;
  onSignIn: () => void;
  onSignOut: () => void;
  onWipeAllData: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  lang,
  user,
  profile,
  reports,
  onSaveProfile,
  onSignIn,
  onSignOut,
  onWipeAllData,
}) => {
  const isAr = lang === 'ar';
  const [form, setForm] = useState<HealthProfile>(profile);
  const [chronicText, setChronicText] = useState(profile.chronicConditions.join('، '));
  const [medsText, setMedsText] = useState(profile.currentMedications.join('، '));
  const [allergiesText, setAllergiesText] = useState(profile.allergies.join('، '));
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    setForm(profile);
    setChronicText(profile.chronicConditions.join('، '));
    setMedsText(profile.currentMedications.join('، '));
    setAllergiesText(profile.allergies.join('، '));
  }, [profile]);

  const splitList = (val: string) =>
    val
      .split(/[،,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: HealthProfile = {
        ...form,
        chronicConditions: splitList(chronicText),
        currentMedications: splitList(medsText),
        allergies: splitList(allergiesText),
        localUpdatedAt: new Date().toISOString(),
      };
      await onSaveProfile(updated);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: form,
      reports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DOCTOR-AI-Health-Data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3323] dark:text-white">
          {isAr ? 'الملف الصحي الشخصي' : 'Personal Health Profile'}
        </h1>
        <p className="text-sm text-[#4A554C] dark:text-[#9DB09F] mt-1">
          {isAr
            ? 'تُستخدم هذه البيانات تلقائيًا لتحسين دقة التقييم الطبي وتعبئة تقاريرك دون الحاجة لإعادة كتابتها.'
            : 'These details automatically enrich your consultations and populate your medical reports.'}
        </p>
      </div>

      {/* Cloud Account Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#4B644A] mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-[#1F3323] dark:text-white">
              {user
                ? isAr
                  ? `متصل بحساب: ${user.email}`
                  : `Signed in as: ${user.email}`
                : isAr
                ? 'وضع الحفظ المحلي (بدون تسجيل دخول)'
                : 'Local Storage Mode (Guest)'}
            </h2>
            <p className="text-xs text-[#4A554C] dark:text-[#9DB09F] mt-0.5">
              {user
                ? isAr
                  ? 'يتم حفظ تقاريرك محليًا ومزامنتها بشكل خاص مع حسابك في قاعدة البيانات السحابية.'
                  : 'Your reports are stored locally and privately synced to your cloud account.'
                : isAr
                ? 'تقاريرك محفوظة بأمان على جهازك. سجّل الدخول بحساب Google لمزامنة تقاريرك عبر الأجهزة.'
                : 'Reports are safely saved on this device. Sign in with Google to sync privately across devices.'}
            </p>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={onSignOut}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-[#CED7CC] dark:border-[#28392B] text-xs font-semibold text-[#1F3323] dark:text-[#E8EFE9] hover:bg-[#F3F6F1] cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الدخول بـ Google' : 'Sign in with Google'}</span>
          </button>
        )}
      </div>

      {/* Health Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
              {isAr ? 'الاسم الكامل (اختياري)' : 'Full Name (Optional)'}
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
                {isAr ? 'العمر' : 'Age'}
              </label>
              <input
                type="text"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder={isAr ? 'مثال: 32' : 'e.g. 32'}
                className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as HealthProfile['gender'] })
                }
                className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
              >
                <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
              {isAr ? 'فصيلة الدم' : 'Blood Type'}
            </label>
            <input
              type="text"
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
              placeholder="O+, A+, B-..."
              className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
              {isAr ? 'جهة اتصال للطوارئ' : 'Emergency Contact'}
            </label>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
            {isAr ? 'الأمراض المزمنة (افصل بينها بفاصلة)' : 'Chronic Conditions (comma separated)'}
          </label>
          <input
            type="text"
            value={chronicText}
            onChange={(e) => setChronicText(e.target.value)}
            placeholder={isAr ? 'مثال: السكري، ارتفاع ضغط الدم، الربو' : 'e.g. Diabetes, Hypertension, Asthma'}
            className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
            {isAr ? 'الأدوية الحالية (افصل بينها بفاصلة)' : 'Current Medications (comma separated)'}
          </label>
          <input
            type="text"
            value={medsText}
            onChange={(e) => setMedsText(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
            {isAr ? 'الحساسية الدوائية أو الغذائية' : 'Medication or Food Allergies'}
          </label>
          <input
            type="text"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder={isAr ? 'مثال: البنسلين، الأسبرين' : 'e.g. Penicillin, Aspirin'}
            className="w-full h-10 px-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#2C432F] dark:text-[#B5C6B7] mb-1.5">
            {isAr ? 'التاريخ الطبي والعمليات السابقة' : 'Past Medical & Surgical History'}
          </label>
          <textarea
            rows={3}
            value={form.pastMedicalHistory}
            onChange={(e) => setForm({ ...form, pastMedicalHistory: e.target.value })}
            className="w-full p-3 rounded-xl bg-[#FAFBF9] dark:bg-[#0D140F] border border-[#DCE3DA] dark:border-[#253528] text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {savedToast && <Check className="w-4 h-4" />}
            <span>
              {savedToast
                ? isAr
                  ? 'تم حفظ الملف الصحي'
                  : 'Profile Saved'
                : saving
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isAr
                ? 'حفظ الملف الصحي'
                : 'Save Health Profile'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-[#CED7CC] dark:border-[#28392B] text-xs font-medium text-[#1F3323] dark:text-[#E8EFE9] hover:bg-[#F3F6F1] cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#4B644A]" />
            <span>{isAr ? 'تصدير نسخة احتياطية (JSON)' : 'Export Backup (JSON)'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete All User Health Data */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121C14] border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
            {isAr ? 'حذف جميع البيانات الصحية' : 'Delete All Health Data'}
          </h3>
          <p className="text-xs text-[#5C6B5E] dark:text-[#8FA392] mt-1">
            {isAr
              ? 'يمسح هذا الإجراء ملفك الصحي وجميع تقاريرك ومحادثاتك من هذا الجهاز ومن السحابة نهائيًا.'
              : 'Permanently removes your health profile, reports, and chat history from this device and the cloud.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmWipe(true)}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isAr ? 'حذف بياناتي بالكامل' : 'Delete All Data'}</span>
        </button>
      </div>

      {confirmWipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#121C14] border border-red-200 dark:border-red-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300">
              {isAr ? 'تأكيد المسح النهائي للبيانات' : 'Confirm Complete Data Erasure'}
            </h3>
            <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6]">
              {isAr
                ? 'سيتم حذف جميع تقاريرك الصحية وسجل المحادثات والملف الصحي بشكل نهائي لا رجعة فيه. هل تريد المتابعة؟'
                : 'All saved medical reports, consultation transcripts, and profile records will be permanently erased. Continue?'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="h-9 px-4 rounded-lg border border-[#CED7CC] text-xs font-medium cursor-pointer"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmWipe(false);
                  await onWipeAllData();
                }}
                className="h-9 px-4 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'نعم، احذف كل شيء' : 'Yes, Erase Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
