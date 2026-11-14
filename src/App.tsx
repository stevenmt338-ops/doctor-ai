/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import {
  buildFallbackAnalysis,
  computeReportStatus,
  createEmptyClinicalData,
  detectEmergencyRedFlags,
  extractClinicalDataLocally,
  generateReferenceNumber,
  generateSafeId,
  getNextFallbackQuestion,
  mergeClinicalData,
} from './services/fallbackClinicalEngine';
import {
  deleteReportEverywhere,
  fetchAndMergeCloudReports,
  fetchProfileFromCloud,
  getLocalProfile,
  getLocalReports,
  saveLocalReport,
  submitUserFeedback,
  syncProfileToCloud,
  syncReportToCloud,
  wipeAllUserData,
} from './services/storageService';
import {
  AIAnalysisResult,
  AppView,
  ChatMessage,
  HealthProfile,
  Language,
  MedicalReport,
  UserFeedback,
} from './types/medical';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ConsultationView } from './components/ConsultationView';
import { ReportView } from './components/ReportView';
import { ReportsLibraryView } from './components/ReportsLibraryView';
import { CompareReportsView } from './components/CompareReportsView';
import { ProfileView } from './components/ProfileView';
import { InfoPagesView } from './components/InfoPagesView';

const ACTIVE_REPORT_SESSION_KEY = 'doctor_ai_active_report_id';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('doctor_ai_lang');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('doctor_ai_dark') === 'true';
  });
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_REPORT_SESSION_KEY)
  );
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

  const [profile, setProfile] = useState<HealthProfile>({
    userId: 'guest',
    fullName: '',
    age: '',
    gender: '',
    bloodType: '',
    chronicConditions: [],
    currentMedications: [],
    allergies: [],
    pastMedicalHistory: '',
    emergencyContact: '',
    preferredLanguage: lang,
    localUpdatedAt: new Date().toISOString(),
  });

  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiErrorNotice, setAiErrorNotice] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const currentScopeId = user ? user.uid : 'guest';

  // Sync HTML dir/lang & dark mode class
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('doctor_ai_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('doctor_ai_dark', String(darkMode));
  }, [darkMode]);

  // Network connectivity tracking
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Auth listener with strict per-user scope isolation
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      const scope = firebaseUser ? firebaseUser.uid : 'guest';

      const localReps = await getLocalReports(scope);
      setReports(localReps);

      const savedActiveId = localStorage.getItem(ACTIVE_REPORT_SESSION_KEY);
      if (savedActiveId && localReps.some((r) => r.id === savedActiveId)) {
        setActiveReportId(savedActiveId);
      } else if (localReps.length > 0) {
        setActiveReportId(localReps[0].id);
      } else {
        setActiveReportId(null);
      }

      const localProf = await getLocalProfile(scope, lang);
      setProfile(localProf);
      setAuthReady(true);

      if (firebaseUser && navigator.onLine) {
        const [mergedReps, cloudProf] = await Promise.all([
          fetchAndMergeCloudReports(firebaseUser.uid),
          fetchProfileFromCloud(firebaseUser.uid, lang),
        ]);
        setReports(mergedReps);
        setProfile(cloudProf);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync pending reports when coming back online
  useEffect(() => {
    if (!isOnline || !user) return;
    const syncPending = async () => {
      const merged = await fetchAndMergeCloudReports(user.uid);
      setReports(merged);
    };
    syncPending();
  }, [isOnline, user]);

  // Keep activeReportId persisted across page reloads
  useEffect(() => {
    if (activeReportId) {
      localStorage.setItem(ACTIVE_REPORT_SESSION_KEY, activeReportId);
    } else {
      localStorage.removeItem(ACTIVE_REPORT_SESSION_KEY);
    }
  }, [activeReportId]);

  const activeReport = reports.find((r) => r.id === activeReportId) || null;

  const upsertReport = useCallback(async (updated: MedicalReport): Promise<MedicalReport> => {
    const savedLocal = await saveLocalReport(updated);
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.id === savedLocal.id);
      const next = idx >= 0 ? prev.map((r) => (r.id === savedLocal.id ? savedLocal : r)) : [savedLocal, ...prev];
      return next.sort(
        (a, b) => new Date(b.localUpdatedAt).getTime() - new Date(a.localUpdatedAt).getTime()
      );
    });

    // Background cloud sync (non-blocking for UI availability)
    syncReportToCloud(savedLocal).then((synced) => {
      setReports((prev) => prev.map((r) => (r.id === synced.id ? synced : r)));
    });

    return savedLocal;
  }, []);

  const createDraftReport = useCallback((): MedicalReport => {
    const now = new Date().toISOString();
    return {
      id: generateSafeId('rep'),
      userId: currentScopeId,
      referenceNumber: generateReferenceNumber(),
      title: lang === 'ar' ? 'تقييم صحي جديد' : 'New Health Assessment',
      status: 'preliminary',
      aiAnalysisStatus: 'pending',
      language: lang,
      patientSnapshot: {
        age: profile.age || '',
        gender: profile.gender || '',
      },
      collectedData: createEmptyClinicalData(profile),
      aiAnalysis: null,
      messages: [],
      progressPercent: 10,
      version: 1,
      syncStatus: user ? 'pending' : 'local_only',
      localCreatedAt: now,
      localUpdatedAt: now,
    };
  }, [currentScopeId, lang, profile, user]);

  const runAIAnalysisForReport = useCallback(
    async (targetReport: MedicalReport): Promise<MedicalReport> => {
      setIsAnalyzing(true);
      try {
        if (!navigator.onLine) {
          throw new Error('OFFLINE');
        }
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectedData: targetReport.collectedData,
            messages: targetReport.messages,
            healthProfile: profile,
            language: lang,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP_${res.status}`);
        }
        const data = await res.json();
        const analysis: AIAnalysisResult = {
          organizedSummary: data.organizedSummary,
          possibleConsiderations: Array.isArray(data.possibleConsiderations)
            ? data.possibleConsiderations
            : [],
          urgencyLevel: data.urgencyLevel || 'soon',
          urgencyExplanation: data.urgencyExplanation || '',
          missingInformation: Array.isArray(data.missingInformation) ? data.missingInformation : [],
          safeGuidance: Array.isArray(data.safeGuidance) ? data.safeGuidance : [],
          whenToSeeDoctor: Array.isArray(data.whenToSeeDoctor) ? data.whenToSeeDoctor : [],
          whenToSeekEmergency: Array.isArray(data.whenToSeekEmergency)
            ? data.whenToSeekEmergency
            : [],
          redFlagsDetected: Boolean(data.redFlagsDetected),
          generatedAt: data.generatedAt || new Date().toISOString(),
        };

        const nextStatus = computeReportStatus(
          targetReport.collectedData,
          analysis,
          targetReport.messages
        );

        const updated: MedicalReport = {
          ...targetReport,
          title: data.suggestedTitle || targetReport.title,
          aiAnalysis: analysis,
          aiAnalysisStatus: 'complete',
          status: nextStatus,
          version: targetReport.version + 1,
          localUpdatedAt: new Date().toISOString(),
        };
        setAiErrorNotice(null);
        return await upsertReport(updated);
      } catch {
        // Fallback report generation — user NEVER loses access to report
        const fallbackAnalysis = buildFallbackAnalysis(targetReport, lang);
        const updated: MedicalReport = {
          ...targetReport,
          aiAnalysis: fallbackAnalysis,
          aiAnalysisStatus: 'unavailable',
          status:
            targetReport.status === 'completed'
              ? 'partial'
              : computeReportStatus(targetReport.collectedData, null, targetReport.messages),
          version: targetReport.version + 1,
          localUpdatedAt: new Date().toISOString(),
        };
        setAiErrorNotice(
          lang === 'ar'
            ? 'تعذر الوصول للتحليل الذكي حاليًا؛ تم حفظ بياناتك وتجهيز التقرير البديل بنجاح.'
            : 'AI analysis is currently unavailable; your answers are saved and a structured fallback report is ready.'
        );
        return await upsertReport(updated);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [lang, profile, upsertReport]
  );

  const processConversationTurn = useCallback(
    async (baseReport: MedicalReport, nextMessages: ChatMessage[]) => {
      setIsSending(true);
      const now = new Date().toISOString();

      // 1. Immediate local extraction & emergency detection BEFORE calling AI
      const locallyExtracted = extractClinicalDataLocally(
        nextMessages,
        baseReport.collectedData,
        profile,
        lang
      );
      const lastUserText =
        [...nextMessages].reverse().find((m) => m.role === 'user')?.content || '';
      const localEmergency = detectEmergencyRedFlags(lastUserText, lang);

      const firstComplaint =
        locallyExtracted.chiefComplaint ||
        nextMessages.find((m) => m.role === 'user')?.content.slice(0, 60) ||
        baseReport.title;

      let workingReport: MedicalReport = {
        ...baseReport,
        title:
          baseReport.title === 'تقييم صحي جديد' || baseReport.title === 'New Health Assessment'
            ? firstComplaint.slice(0, 70)
            : baseReport.title,
        collectedData: locallyExtracted,
        messages: nextMessages,
        status: computeReportStatus(locallyExtracted, baseReport.aiAnalysis, nextMessages),
        patientSnapshot: {
          age: profile.age || baseReport.patientSnapshot?.age || '',
          gender: profile.gender || baseReport.patientSnapshot?.gender || '',
        },
        version: baseReport.version + 1,
        localUpdatedAt: now,
      };

      // Save user's message immediately so refresh/crash/disconnect never loses it
      workingReport = await upsertReport(workingReport);
      setActiveReportId(workingReport.id);

      try {
        if (!navigator.onLine) {
          throw new Error('OFFLINE');
        }

        const response = await fetch('/api/ai/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages,
            collectedData: workingReport.collectedData,
            healthProfile: profile,
            language: lang,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP_${response.status}`);
        }

        const aiData = await response.json();
        const mergedData = mergeClinicalData(workingReport.collectedData, aiData.extractedData || {});
        const emergency = aiData.emergencyAlert?.detected
          ? aiData.emergencyAlert
          : localEmergency.detected
          ? localEmergency
          : null;

        const assistantMessage: ChatMessage = {
          id: generateSafeId('msg'),
          role: 'assistant',
          content:
            aiData.reply ||
            getNextFallbackQuestion(mergedData, nextMessages, lang).reply,
          timestamp: new Date().toISOString(),
          quickReplies: Array.isArray(aiData.suggestedQuickReplies)
            ? aiData.suggestedQuickReplies
            : [],
          emergencyAlert: emergency,
        };

        const finalMessages = [...nextMessages, assistantMessage];
        let updatedReport: MedicalReport = {
          ...workingReport,
          title: aiData.suggestedTitle || workingReport.title,
          collectedData: mergedData,
          messages: finalMessages,
          progressPercent: Math.min(
            100,
            Math.max(workingReport.progressPercent, Number(aiData.progressPercent || 25))
          ),
          status: computeReportStatus(mergedData, workingReport.aiAnalysis, finalMessages),
          version: workingReport.version + 1,
          localUpdatedAt: new Date().toISOString(),
        };

        updatedReport = await upsertReport(updatedReport);
        setAiErrorNotice(null);

        // Automatically run full AI clinical analysis once interview reaches readiness
        if (aiData.isReadyForReport && updatedReport.aiAnalysisStatus !== 'complete') {
          await runAIAnalysisForReport(updatedReport);
        }
      } catch {
        // Resilient Local Clinical Interview Fallback
        const fallbackTurn = getNextFallbackQuestion(
          workingReport.collectedData,
          nextMessages,
          lang
        );

        const assistantMessage: ChatMessage = {
          id: generateSafeId('msg'),
          role: 'assistant',
          content: localEmergency.detected
            ? `${localEmergency.reason}\n${localEmergency.immediateAction}`
            : fallbackTurn.reply,
          timestamp: new Date().toISOString(),
          quickReplies: fallbackTurn.quickReplies,
          emergencyAlert: localEmergency.detected ? localEmergency : null,
        };

        const finalMessages = [...nextMessages, assistantMessage];
        const fallbackAnalysis = buildFallbackAnalysis(
          { ...workingReport, messages: finalMessages },
          lang
        );

        const updatedReport: MedicalReport = {
          ...workingReport,
          messages: finalMessages,
          progressPercent: fallbackTurn.progressPercent,
          aiAnalysis: fallbackAnalysis,
          aiAnalysisStatus: 'unavailable',
          status: computeReportStatus(workingReport.collectedData, null, finalMessages),
          version: workingReport.version + 1,
          localUpdatedAt: new Date().toISOString(),
        };

        await upsertReport(updatedReport);
        setAiErrorNotice(
          lang === 'ar'
            ? 'يعمل النظام الآن بالمحرك الاحتياطي المحلي؛ يتم حفظ جميع إجاباتك ويمكنك إنشاء التقرير وتنزيله في أي وقت.'
            : 'Running on local clinical fallback; all responses are saved and your report remains ready anytime.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [lang, profile, runAIAnalysisForReport, upsertReport]
  );

  const handleStartAssessment = async (initialSymptom?: string) => {
    const newDraft = createDraftReport();
    const saved = await upsertReport(newDraft);
    setActiveReportId(saved.id);
    setCurrentView('consultation');
    setAiErrorNotice(null);

    if (initialSymptom) {
      const userMsg: ChatMessage = {
        id: generateSafeId('msg'),
        role: 'user',
        content: initialSymptom,
        timestamp: new Date().toISOString(),
      };
      await processConversationTurn(saved, [userMsg]);
    }
  };

  const handleSendMessage = async (text: string) => {
    const target = activeReport || createDraftReport();
    const userMsg: ChatMessage = {
      id: generateSafeId('msg'),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...target.messages, userMsg];
    await processConversationTurn(target, nextMessages);
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!activeReport) return;
    const idx = activeReport.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;

    const sliced = activeReport.messages.slice(0, idx + 1).map((m, i) =>
      i === idx
        ? { ...m, content: newText, edited: true, timestamp: new Date().toISOString() }
        : m
    );
    const resetBase: MedicalReport = {
      ...activeReport,
      collectedData: createEmptyClinicalData(profile),
      aiAnalysis: null,
      aiAnalysisStatus: 'pending',
    };
    await processConversationTurn(resetBase, sliced);
  };

  const handleRollbackToMessage = async (messageId: string) => {
    if (!activeReport) return;
    const idx = activeReport.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const sliced = activeReport.messages.slice(0, idx + 1);
    const reExtracted = extractClinicalDataLocally(
      sliced,
      createEmptyClinicalData(profile),
      profile,
      lang
    );
    const updated: MedicalReport = {
      ...activeReport,
      messages: sliced,
      collectedData: reExtracted,
      aiAnalysis: null,
      aiAnalysisStatus: 'pending',
      status: computeReportStatus(reExtracted, null, sliced),
      version: activeReport.version + 1,
      localUpdatedAt: new Date().toISOString(),
    };
    await upsertReport(updated);
  };

  const handleSignIn = async () => {
    setAuthNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthNotice(
        lang === 'ar'
          ? 'تعذر إتمام تسجيل الدخول. تأكد من السماح بالنوافذ المنبثقة.'
          : 'Sign-in could not be completed. Please allow popups and try again.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveReportId(null);
    setCurrentView('home');
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReportEverywhere(currentScopeId, reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (activeReportId === reportId) {
      setActiveReportId(null);
    }
  };

  const handleSaveProfile = async (updated: HealthProfile) => {
    const withScope = { ...updated, userId: currentScopeId };
    setProfile(withScope);
    await syncProfileToCloud(withScope);
  };

  const handleWipeAllData = async () => {
    await wipeAllUserData(currentScopeId);
    setReports([]);
    setActiveReportId(null);
    const freshProf = await getLocalProfile(currentScopeId, lang);
    setProfile(freshProf);
  };

  const handleSubmitFeedback = async (feedback: UserFeedback) => {
    await submitUserFeedback({ ...feedback, userId: currentScopeId });
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FAFBF9] dark:bg-[#0D140F] flex items-center justify-center">
        <div className="text-sm font-medium text-[#4B644A]">
          {lang === 'ar' ? 'جاري تحميل دكتور AI...' : 'Loading DOCTOR AI...'}
        </div>
      </div>
    );
  }

  const compareReportA = compareIds ? reports.find((r) => r.id === compareIds[0]) || null : null;
  const compareReportB = compareIds ? reports.find((r) => r.id === compareIds[1]) || null : null;

  return (
    <div className="min-h-screen bg-[#FAFBF9] dark:bg-[#0D140F] text-[#172119] dark:text-[#E8EFE9] transition-colors">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((prev) => !prev)}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onStartNewAssessment={() => handleStartAssessment()}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {authNotice && (
        <div className="no-print max-w-4xl mx-auto px-4 pt-3">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>{authNotice}</span>
            <button type="button" onClick={() => setAuthNotice(null)} className="font-bold px-2 cursor-pointer">
              ×
            </button>
          </div>
        </div>
      )}

      <main>
        {currentView === 'home' && (
          <HomeView
            lang={lang}
            reportsCount={reports.length}
            onStartAssessment={(symptom) => handleStartAssessment(symptom)}
            onNavigate={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'consultation' && (
          <ConsultationView
            lang={lang}
            activeReport={activeReport}
            allReports={reports}
            isOnline={isOnline}
            isSending={isSending}
            aiErrorNotice={aiErrorNotice}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onRollbackToMessage={handleRollbackToMessage}
            onSelectReport={(id) => setActiveReportId(id)}
            onStartNewAssessment={() => handleStartAssessment()}
            onOpenReport={() => {
              if (activeReport) setCurrentView('report');
            }}
            onRunAIAnalysis={async () => {
              if (activeReport) await runAIAnalysisForReport(activeReport);
            }}
          />
        )}

        {currentView === 'report' && (
          <ReportView
            lang={lang}
            report={activeReport}
            isOnline={isOnline}
            isAnalyzing={isAnalyzing}
            onBackToChat={() => setCurrentView('consultation')}
            onRunAIAnalysis={async () => {
              if (activeReport) await runAIAnalysisForReport(activeReport);
            }}
            onRegenerateReport={async () => {
              if (!activeReport) return;
              const reExtracted = extractClinicalDataLocally(
                activeReport.messages,
                createEmptyClinicalData(profile),
                profile,
                lang
              );
              const rebuilt: MedicalReport = {
                ...activeReport,
                collectedData: reExtracted,
                patientSnapshot: {
                  age: profile.age || activeReport.patientSnapshot?.age || '',
                  gender: profile.gender || activeReport.patientSnapshot?.gender || '',
                },
                aiAnalysis:
                  activeReport.aiAnalysisStatus === 'complete'
                    ? activeReport.aiAnalysis
                    : buildFallbackAnalysis({ ...activeReport, collectedData: reExtracted }, lang),
                version: activeReport.version + 1,
                localUpdatedAt: new Date().toISOString(),
              };
              const saved = await upsertReport(rebuilt);
              if (isOnline && saved.aiAnalysisStatus !== 'complete') {
                await runAIAnalysisForReport(saved);
              }
            }}
            onGoToReports={() => setCurrentView('reports')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsLibraryView
            lang={lang}
            reports={reports}
            onOpenReport={(id) => {
              setActiveReportId(id);
              setCurrentView('report');
            }}
            onResumeChat={(id) => {
              setActiveReportId(id);
              setCurrentView('consultation');
            }}
            onDeleteReport={handleDeleteReport}
            onStartNewAssessment={() => handleStartAssessment()}
            onCompareReports={(idA, idB) => {
              setCompareIds([idA, idB]);
              setCurrentView('compare');
            }}
          />
        )}

        {currentView === 'compare' && (
          <CompareReportsView
            lang={lang}
            reportA={compareReportA}
            reportB={compareReportB}
            onBack={() => setCurrentView('reports')}
            onOpenReport={(id) => {
              setActiveReportId(id);
              setCurrentView('report');
            }}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            lang={lang}
            user={user}
            profile={profile}
            reports={reports}
            onSaveProfile={handleSaveProfile}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onWipeAllData={handleWipeAllData}
          />
        )}

        {(currentView === 'about' ||
          currentView === 'help' ||
          currentView === 'privacy' ||
          currentView === 'terms' ||
          currentView === 'disclaimer' ||
          currentView === 'feedback') && (
          <InfoPagesView
            lang={lang}
            view={currentView}
            userId={currentScopeId}
            onNavigate={(v) => setCurrentView(v)}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}
      </main>
    </div>
  );
}
