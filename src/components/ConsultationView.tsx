import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Edit3,
  FileText,
  History,
  Mic,
  MicOff,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { COPY, STATUS_LABELS } from '../services/i18n';
import { generateA4ReportPDF, formatReportAsText } from '../services/pdfService';
import { Language, MedicalReport } from '../types/medical';
import { A4MedicalReportSheet } from './A4MedicalReportSheet';

interface ConsultationViewProps {
  lang: Language;
  activeReport: MedicalReport | null;
  allReports: MedicalReport[];
  isOnline: boolean;
  isSending: boolean;
  aiErrorNotice: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onEditMessage: (messageId: string, newText: string) => Promise<void>;
  onRollbackToMessage: (messageId: string) => Promise<void>;
  onSelectReport: (reportId: string) => void;
  onStartNewAssessment: () => void;
  onOpenReport: () => void;
  onRunAIAnalysis: () => Promise<void>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const ConsultationView: React.FC<ConsultationViewProps> = ({
  lang,
  activeReport,
  allReports,
  isOnline,
  isSending,
  aiErrorNotice,
  onSendMessage,
  onEditMessage,
  onRollbackToMessage,
  onSelectReport,
  onStartNewAssessment,
  onOpenReport,
  onRunAIAnalysis,
}) => {
  const isAr = lang === 'ar';
  const t = COPY[lang];
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const pdfSheetRef = useRef<HTMLDivElement | null>(null);

  const messages = activeReport?.messages || [];
  const hasUserData = messages.some((m) => m.role === 'user');
  const progress = activeReport?.progressPercent || 0;

  const emergencyAlert =
    [...messages].reverse().find((m) => m.emergencyAlert?.detected)?.emergencyAlert || null;

  const lastAssistantQuickReplies =
    [...messages].reverse().find((m) => m.role === 'assistant')?.quickReplies || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    setInputText('');
    await onSendMessage(trimmed);
  };

  const handleVoiceToggle = () => {
    setVoiceNotice(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceNotice(
        isAr
          ? 'الإملاء الصوتي غير مدعوم في هذا المتصفح، يمكنك كتابة أعراضك مباشرة.'
          : 'Voice dictation is not supported in this browser. Please type your symptoms directly.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = isAr ? 'ar-EG' : 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice(
          isAr
            ? 'تعذر الوصول إلى الميكروفون. تحقق من أذونات المتصفح.'
            : 'Unable to access microphone. Please check browser permissions.'
        );
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice(
        isAr ? 'تعذر تشغيل الإملاء الصوتي.' : 'Could not start voice dictation.'
      );
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setEditingId(null);
    await onEditMessage(msgId, trimmed);
  };

  const handleCopyReport = async () => {
    if (!activeReport) return;
    try {
      await navigator.clipboard.writeText(formatReportAsText(activeReport, lang));
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadPdf = async () => {
    if (!activeReport || !pdfSheetRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      await generateA4ReportPDF(pdfSheetRef.current, activeReport, lang);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const examplePrompts = isAr
    ? [
        'عندي صداع ودوخة منذ الصباح',
        'عندي ألم شديد في البطن مع غثيان',
        'عندي كحة وحرارة منذ يومين',
        'عندي إرهاق مستمر منذ أسبوع',
        'عندي ألم في أسفل الظهر',
      ]
    : [
        'I have a headache and dizziness since morning',
        'I have severe abdominal pain with nausea',
        'I have had a cough and fever for two days',
        'I feel persistent fatigue for a week',
        'I have lower back pain',
      ];

  const SendIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Offscreen / Print-only A4 Sheet so Download PDF & Print work directly from Chat */}
      {activeReport && (
        <div className="hidden print:block">
          <A4MedicalReportSheet report={activeReport} lang={lang} />
        </div>
      )}
      {activeReport && (
        <div className="fixed -left-[99999px] top-0 pointer-events-none opacity-0" aria-hidden="true">
          <A4MedicalReportSheet report={activeReport} lang={lang} sheetRef={pdfSheetRef} />
        </div>
      )}

      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Conversation History & Extracted Summary */}
        <aside
          className={`lg:col-span-4 xl:col-span-3 space-y-4 ${
            showSidebarMobile ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] space-y-3">
            <button
              type="button"
              onClick={() => {
                onStartNewAssessment();
                setShowSidebarMobile(false);
              }}
              className="w-full h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] dark:hover:bg-[#5B7A5A] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newAssessment}</span>
            </button>

            <div className="pt-2 border-t border-[#E6EBE4] dark:border-[#223025]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#3B483D] dark:text-[#B5C6B7] mb-2">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#4B644A]" />
                  {isAr ? 'سجل المحادثات' : 'Consultation History'}
                </span>
                <span className="tabular-nums text-[#647366]">{allReports.length}</span>
              </div>

              {allReports.length === 0 ? (
                <p className="text-xs text-[#647366] dark:text-[#8FA392] py-3">
                  {isAr
                    ? 'ستظهر هنا تقييماتك السابقة تلقائيًا بمجرد بدء المحادثة.'
                    : 'Your consultations will appear here automatically once you begin.'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {allReports.slice(0, 12).map((rep) => {
                    const isSelected = rep.id === activeReport?.id;
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => {
                          onSelectReport(rep.id);
                          setShowSidebarMobile(false);
                        }}
                        className={`w-full text-start px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEF3EC] dark:bg-[#1B2B1E] text-[#1F3323] dark:text-white font-semibold'
                            : 'hover:bg-[#F5F7F4] dark:hover:bg-[#17231A] text-[#4A554C] dark:text-[#9DB09F]'
                        }`}
                      >
                        <div className="truncate">{rep.title}</div>
                        <div className="text-[11px] text-[#6A796C] dark:text-[#7E9281] mt-0.5 flex items-center gap-1.5">
                          <span>{STATUS_LABELS[rep.status][lang]}</span>
                          <span>·</span>
                          <span className="font-mono">{rep.referenceNumber}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Live Extracted Clinical Facts */}
          {activeReport && hasUserData && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] space-y-3 text-xs">
              <div className="font-bold text-[#1F3323] dark:text-white">
                {isAr ? 'البيانات الموثقة تلقائيًا' : 'Auto-Saved Clinical Notes'}
              </div>
              <dl className="space-y-2 text-[#4A554C] dark:text-[#A9B9AB]">
                <div>
                  <dt className="text-[11px] text-[#6A796C]">{isAr ? 'الشكوى الرئيسية' : 'Chief Complaint'}</dt>
                  <dd className="font-medium text-[#172119] dark:text-[#E8EFE9] mt-0.5">
                    {activeReport.collectedData.chiefComplaint || '—'}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-[11px] text-[#6A796C]">{isAr ? 'الموقع' : 'Location'}</dt>
                    <dd className="font-medium text-[#172119] dark:text-[#E8EFE9]">
                      {activeReport.collectedData.painLocation || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#6A796C]">{isAr ? 'الشدة' : 'Severity'}</dt>
                    <dd className="font-medium text-[#172119] dark:text-[#E8EFE9]">
                      {activeReport.collectedData.severity || '—'}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[11px] text-[#6A796C]">{isAr ? 'المدة / البداية' : 'Duration / Onset'}</dt>
                  <dd className="font-medium text-[#172119] dark:text-[#E8EFE9]">
                    {activeReport.collectedData.duration || activeReport.collectedData.onsetTime || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </aside>

        {/* Main Chat Workspace */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col bg-white dark:bg-[#121C14] border border-[#DCE3DA] dark:border-[#223025] rounded-2xl overflow-hidden min-h-[75vh] max-h-[84vh]">
          {/* Top Consultation Status & Progress Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5EAE3] dark:border-[#223025] space-y-2.5 bg-[#FAFBF9] dark:bg-[#101812]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSidebarMobile((prev) => !prev)}
                  className="lg:hidden px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#DCE3DA] dark:border-[#253528] text-[#1F3323] dark:text-[#E8EFE9]"
                >
                  <History className="w-4 h-4 inline me-1" />
                  {isAr ? 'السجل' : 'History'}
                </button>
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-[#1F3323] dark:text-white">
                    {activeReport?.title || (isAr ? 'تقييم صحي ذكي جديد' : 'New Smart Health Assessment')}
                  </h1>
                  <div className="text-[11px] text-[#607063] dark:text-[#8FA392] flex flex-wrap items-center gap-1.5">
                    <span>
                      {activeReport ? STATUS_LABELS[activeReport.status][lang] : (isAr ? 'تقييم جديد' : 'New Session')}
                    </span>
                    <span>·</span>
                    <span>
                      {activeReport?.syncStatus === 'synced'
                        ? t.syncedCloud
                        : activeReport?.syncStatus === 'pending'
                        ? t.pendingSync
                        : t.savedLocal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Progress */}
              <div className="flex items-center gap-3">
                <div className="w-28 sm:w-36 h-2 rounded-full bg-[#E3E9E1] dark:bg-[#223025] overflow-hidden">
                  <div
                    className="h-full bg-[#4B644A] transition-all duration-300"
                    style={{ width: `${Math.max(8, progress)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#2C432F] dark:text-[#98B999] tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Always-Visible Permanent Report Action Bar once ANY symptom exists */}
            {activeReport && hasUserData && (
              <div className="pt-2 border-t border-[#E6EBE4] dark:border-[#1E2B20] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.viewReport}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#2A3C2D] bg-white dark:bg-[#162218] hover:bg-[#F3F6F1] text-[#1F3323] dark:text-[#E8EFE9] text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5 text-[#4B644A]" />
                  <span>{downloadingPdf ? (isAr ? 'جاري التجهيز...' : 'Generating...') : t.downloadPdf}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#2A3C2D] bg-white dark:bg-[#162218] hover:bg-[#F3F6F1] text-[#1F3323] dark:text-[#E8EFE9] text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#4B644A]" />
                  <span>{t.printReport}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#CED7CC] dark:border-[#2A3C2D] bg-white dark:bg-[#162218] hover:bg-[#F3F6F1] text-[#1F3323] dark:text-[#E8EFE9] text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedToast ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#4B644A]" />
                  )}
                  <span>{copiedToast ? t.copied : t.copyReport}</span>
                </button>

                {activeReport.aiAnalysisStatus !== 'complete' && isOnline && (
                  <button
                    type="button"
                    onClick={onRunAIAnalysis}
                    disabled={isSending}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3EC] dark:bg-[#1E2E21] text-[#1F3323] dark:text-[#CFE0D1] hover:bg-[#E1EAE0] text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#4B644A]" />
                    <span>{isAr ? 'استكمال التحليل الذكي' : 'Run AI Analysis'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Offline or AI Fallback Notice */}
          {(!isOnline || aiErrorNotice) && (
            <div className="px-4 sm:px-6 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                {!isOnline
                  ? t.offline
                  : aiErrorNotice}
              </span>
            </div>
          )}

          {/* Immediate Emergency Alert Banner */}
          {emergencyAlert && (
            <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-bold">
                  {isAr ? 'تنبيه طوارئ فوري — يرجى طلب الرعاية الطبية العاجلة' : 'Immediate Emergency Warning'}
                </div>
                <p>{emergencyAlert.reason}</p>
                <p className="font-semibold">{emergencyAlert.immediateAction}</p>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
            {messages.length === 0 ? (
              <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1F3323] dark:text-white">
                    {isAr ? 'مرحبًا بك في دكتور AI' : 'Welcome to DOCTOR AI'}
                  </h2>
                  <p className="text-sm text-[#4A554C] dark:text-[#A4B5A6] leading-relaxed">
                    {isAr
                      ? 'اكتب الأعراض التي تشعر بها الآن بالتفصيل أو اختر أحد الأمثلة التالية، وسأطرح عليك أسئلة متابعة منظمة سؤالًا بسؤال.'
                      : 'Describe the symptoms you are experiencing in your own words, or choose a common example below to start your structured interview.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {examplePrompts.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => onSendMessage(ex)}
                      className="px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[#F4F6F3] dark:bg-[#17231A] hover:bg-[#E5ECE3] dark:hover:bg-[#1E2E21] text-[#1F3323] dark:text-[#D9E6DA] border border-[#DCE3DA] dark:border-[#243427] transition-colors cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isEditing = editingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 ${
                        isUser
                          ? 'bg-[#1F3323] text-white dark:bg-[#2E4833]'
                          : 'bg-[#F4F6F3] dark:bg-[#17231A] text-[#172119] dark:text-[#E8EFE9] border border-[#E2E8E0] dark:border-[#253528]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[11px] opacity-75">
                        <span className="font-semibold">
                          {isUser ? (isAr ? 'أنت' : 'You') : 'دكتور AI · DOCTOR AI'}
                        </span>
                        {msg.edited && (
                          <span>{isAr ? '(تم التعديل)' : '(Edited)'}</span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            className="w-full p-2 rounded-lg bg-white text-[#172119] text-sm border border-[#CED7CC] focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-3 py-1 rounded-md bg-white text-[#1F3323] text-xs font-semibold cursor-pointer"
                            >
                              {isAr ? 'حفظ وتحديث' : 'Save & Update'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 rounded-md bg-black/20 text-white text-xs cursor-pointer"
                            >
                              {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Edit & Rollback Controls on User Messages */}
                      {isUser && !isEditing && (
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-white/75">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(msg.id);
                              setEditingText(msg.content);
                            }}
                            className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isAr ? 'تعديل' : 'Edit'}</span>
                          </button>
                          {idx < messages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => onRollbackToMessage(msg.id)}
                              className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{isAr ? 'الرجوع هنا' : 'Return here'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex justify-end">
                <div className="px-4 py-3 rounded-2xl bg-[#F4F6F3] dark:bg-[#17231A] border border-[#E2E8E0] dark:border-[#253528] text-xs text-[#4A554C] dark:text-[#9DB09F]">
                  {isAr ? 'يقوم دكتور AI بمراجعة إجابتك...' : 'DOCTOR AI is reviewing your response...'}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Replies for Current Question */}
          {lastAssistantQuickReplies.length > 0 && !isSending && (
            <div className="px-4 sm:px-6 pb-2 flex flex-wrap gap-2">
              {lastAssistantQuickReplies.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => onSendMessage(qr)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EEF3EC] dark:bg-[#19261C] hover:bg-[#E1EAE0] text-[#1F3323] dark:text-[#CFE0D1] border border-[#D4DED2] dark:border-[#263729] transition-colors cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Voice notice */}
          {voiceNotice && (
            <div className="px-4 sm:px-6 pb-2 text-xs text-amber-700 dark:text-amber-300">
              {voiceNotice}
            </div>
          )}

          {/* Composer Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 border-t border-[#E5EAE3] dark:border-[#223025] bg-[#FAFBF9] dark:bg-[#101812]"
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                aria-label={isAr ? 'الإملاء الصوتي' : 'Voice dictation'}
                className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-[#162218] text-[#4B644A] border-[#CED7CC] dark:border-[#28392B] hover:bg-[#F0F4EE]'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={1}
                placeholder={
                  isAr
                    ? 'اكتب الأعراض التي تشعر بها أو أجب عن السؤال...'
                    : 'Describe your symptoms or answer the question...'
                }
                className="flex-1 min-h-[44px] max-h-32 px-4 py-2.5 rounded-xl bg-white dark:bg-[#162218] border border-[#CED7CC] dark:border-[#28392B] text-sm text-[#172119] dark:text-[#E8EFE9] placeholder:text-[#7A887C] focus:outline-none focus:border-[#4B644A] resize-y"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="h-11 px-4 shrink-0 rounded-xl bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] dark:hover:bg-[#5B7A5A] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 cursor-pointer"
              >
                <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
                {isAr ? <Send className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#647366] dark:text-[#8FA392] mt-2 text-center">
              {t.disclaimerShort}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};
