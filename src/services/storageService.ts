import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { HealthProfile, Language, MedicalReport, UserFeedback } from '../types/medical';

const DB_NAME = 'doctor_ai_storage_v1';
const DB_VERSION = 1;
const STORE_REPORTS = 'reports';
const STORE_PROFILES = 'profiles';
const LS_REPORTS_PREFIX = 'doctor_ai_reports_';
const LS_PROFILE_PREFIX = 'doctor_ai_profile_';

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE_REPORTS)) {
          const store = database.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
        }
        if (!database.objectStoreNames.contains(STORE_PROFILES)) {
          database.createObjectStore(STORE_PROFILES, { keyPath: 'userId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readLocalReportsFallback(userId: string): MedicalReport[] {
  try {
    const raw = localStorage.getItem(`${LS_REPORTS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReportsFallback(userId: string, reports: MedicalReport[]) {
  try {
    localStorage.setItem(`${LS_REPORTS_PREFIX}${userId}`, JSON.stringify(reports));
  } catch (e) {
    console.warn('localStorage write warning:', e);
  }
}

export async function getLocalReports(userId: string): Promise<MedicalReport[]> {
  const fallbackList = readLocalReportsFallback(userId);
  const database = await openDB();
  if (!database) {
    return fallbackList.sort(
      (a, b) => new Date(b.localUpdatedAt).getTime() - new Date(a.localUpdatedAt).getTime()
    );
  }

  return new Promise((resolve) => {
    try {
      const tx = database.transaction(STORE_REPORTS, 'readonly');
      const store = tx.objectStore(STORE_REPORTS);
      const index = store.index('userId');
      const req = index.getAll(userId);
      req.onsuccess = () => {
        const rows = (req.result || []) as MedicalReport[];
        const mergedMap = new Map<string, MedicalReport>();
        for (const r of fallbackList) mergedMap.set(r.id, r);
        for (const r of rows) {
          const prev = mergedMap.get(r.id);
          if (!prev || r.version >= prev.version) {
            mergedMap.set(r.id, r);
          }
        }
        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.localUpdatedAt).getTime() - new Date(a.localUpdatedAt).getTime()
        );
        resolve(sorted);
      };
      req.onerror = () => resolve(fallbackList);
    } catch {
      resolve(fallbackList);
    }
  });
}

export async function saveLocalReport(report: MedicalReport): Promise<MedicalReport> {
  // Always persist in localStorage as fast crash-proof layer
  const existingLS = readLocalReportsFallback(report.userId);
  const idx = existingLS.findIndex((r) => r.id === report.id);
  const updatedList = [...existingLS];
  if (idx >= 0) {
    // Conflict guard: keep higher version if concurrent write
    if (existingLS[idx].version > report.version) {
      report = { ...report, version: existingLS[idx].version + 1 };
    }
    updatedList[idx] = report;
  } else {
    updatedList.unshift(report);
  }
  writeLocalReportsFallback(report.userId, updatedList);

  const database = await openDB();
  if (database) {
    await new Promise<void>((resolve) => {
      try {
        const tx = database.transaction(STORE_REPORTS, 'readwrite');
        tx.objectStore(STORE_REPORTS).put(report);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  return report;
}

export async function deleteLocalReport(userId: string, reportId: string): Promise<void> {
  const existingLS = readLocalReportsFallback(userId).filter((r) => r.id !== reportId);
  writeLocalReportsFallback(userId, existingLS);

  const database = await openDB();
  if (database) {
    await new Promise<void>((resolve) => {
      try {
        const tx = database.transaction(STORE_REPORTS, 'readwrite');
        tx.objectStore(STORE_REPORTS).delete(reportId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export async function getLocalProfile(userId: string, defaultLang: Language): Promise<HealthProfile> {
  const empty: HealthProfile = {
    userId,
    fullName: '',
    age: '',
    gender: '',
    bloodType: '',
    chronicConditions: [],
    currentMedications: [],
    allergies: [],
    pastMedicalHistory: '',
    emergencyContact: '',
    preferredLanguage: defaultLang,
    localUpdatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(`${LS_PROFILE_PREFIX}${userId}`);
    if (raw) {
      return { ...empty, ...JSON.parse(raw), userId };
    }
  } catch {
    // ignore
  }

  const database = await openDB();
  if (!database) return empty;

  return new Promise((resolve) => {
    try {
      const tx = database.transaction(STORE_PROFILES, 'readonly');
      const req = tx.objectStore(STORE_PROFILES).get(userId);
      req.onsuccess = () => resolve(req.result ? { ...empty, ...req.result, userId } : empty);
      req.onerror = () => resolve(empty);
    } catch {
      resolve(empty);
    }
  });
}

export async function saveLocalProfile(profile: HealthProfile): Promise<void> {
  try {
    localStorage.setItem(`${LS_PROFILE_PREFIX}${profile.userId}`, JSON.stringify(profile));
  } catch {
    // ignore
  }
  const database = await openDB();
  if (database) {
    await new Promise<void>((resolve) => {
      try {
        const tx = database.transaction(STORE_PROFILES, 'readwrite');
        tx.objectStore(STORE_PROFILES).put(profile);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

function sanitizeForFirestore(report: MedicalReport, uid: string) {
  return {
    id: report.id.slice(0, 128),
    userId: uid,
    referenceNumber: report.referenceNumber.slice(0, 64),
    title: (report.title || 'تقييم صحي').slice(0, 200),
    status: report.status,
    aiAnalysisStatus: report.aiAnalysisStatus,
    language: report.language,
    patientSnapshot: {
      age: String(report.patientSnapshot?.age || '').slice(0, 20),
      gender: report.patientSnapshot?.gender || '',
    },
    collectedData: report.collectedData,
    aiAnalysis: report.aiAnalysis || null,
    messages: (report.messages || []).slice(-100).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content.slice(0, 4000),
      timestamp: m.timestamp,
      edited: Boolean(m.edited),
    })),
    progressPercent: Math.min(100, Math.max(0, Number(report.progressPercent || 0))),
    version: Math.max(1, Number(report.version || 1)),
    localCreatedAt: report.localCreatedAt.slice(0, 64),
    localUpdatedAt: report.localUpdatedAt.slice(0, 64),
  };
}

export async function syncReportToCloud(report: MedicalReport): Promise<MedicalReport> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || report.userId !== user.uid || !navigator.onLine) {
    return { ...report, syncStatus: user ? 'pending' : 'local_only' };
  }

  const docPath = `reports/${report.id}`;
  const ref = doc(db, 'reports', report.id);
  try {
    const existingSnap = await getDoc(ref);
    const payload = sanitizeForFirestore(report, user.uid);

    if (existingSnap.exists()) {
      const remoteData = existingSnap.data();
      // Conflict resolution: if remote has strictly newer version and we didn't intentionally bump
      if (typeof remoteData.version === 'number' && remoteData.version > report.version) {
        const merged: MedicalReport = {
          ...(remoteData as MedicalReport),
          syncStatus: 'synced',
        };
        await saveLocalReport(merged);
        return merged;
      }

      const { id: _id, userId: _u, referenceNumber: _r, localCreatedAt: _lc, ...updatable } = payload;
      await setDoc(
        ref,
        {
          ...updatable,
          id: payload.id,
          userId: payload.userId,
          referenceNumber: payload.referenceNumber,
          localCreatedAt: payload.localCreatedAt,
          createdAt: remoteData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      );
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const syncedReport: MedicalReport = { ...report, syncStatus: 'synced' };
    await saveLocalReport(syncedReport);
    return syncedReport;
  } catch (err) {
    console.warn('Cloud sync failed, preserved locally:', err);
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      try {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      } catch {
        // Still preserve local report and signal sync error gracefully
      }
    }
    const pendingReport: MedicalReport = { ...report, syncStatus: 'error' };
    await saveLocalReport(pendingReport);
    return pendingReport;
  }
}

export async function fetchAndMergeCloudReports(uid: string): Promise<MedicalReport[]> {
  const localReports = await getLocalReports(uid);
  if (!auth.currentUser || auth.currentUser.uid !== uid || !navigator.onLine) {
    return localReports;
  }

  try {
    const q = query(collection(db, 'reports'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    const mergedMap = new Map<string, MedicalReport>();

    for (const local of localReports) {
      mergedMap.set(local.id, local);
    }

    const toSyncUp: MedicalReport[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const cloudReport: MedicalReport = {
        id: data.id || docSnap.id,
        userId: data.userId,
        referenceNumber: data.referenceNumber,
        title: data.title,
        status: data.status,
        aiAnalysisStatus: data.aiAnalysisStatus,
        language: data.language || 'ar',
        patientSnapshot: data.patientSnapshot || { age: '', gender: '' },
        collectedData: data.collectedData,
        aiAnalysis: data.aiAnalysis || null,
        messages: Array.isArray(data.messages) ? data.messages : [],
        progressPercent: Number(data.progressPercent || 0),
        version: Number(data.version || 1),
        syncStatus: 'synced',
        localCreatedAt: data.localCreatedAt || new Date().toISOString(),
        localUpdatedAt: data.localUpdatedAt || new Date().toISOString(),
      };

      const existing = mergedMap.get(cloudReport.id);
      if (!existing) {
        mergedMap.set(cloudReport.id, cloudReport);
        saveLocalReport(cloudReport);
      } else if (cloudReport.version > existing.version) {
        mergedMap.set(cloudReport.id, cloudReport);
        saveLocalReport(cloudReport);
      } else if (existing.version > cloudReport.version || existing.syncStatus !== 'synced') {
        toSyncUp.push(existing);
      }
    });

    // Also find local-only reports created while offline for this uid
    for (const local of localReports) {
      if (local.syncStatus !== 'synced' && !toSyncUp.some((r) => r.id === local.id)) {
        toSyncUp.push(local);
      }
    }

    for (const pending of toSyncUp) {
      await syncReportToCloud(pending);
    }

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.localUpdatedAt).getTime() - new Date(a.localUpdatedAt).getTime()
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      try {
        handleFirestoreError(err, OperationType.LIST, 'reports');
      } catch {
        // Fallback cleanly to local reports
      }
    }
    return localReports;
  }
}

export async function deleteReportEverywhere(userId: string, reportId: string): Promise<void> {
  await deleteLocalReport(userId, reportId);
  const user = auth.currentUser;
  if (user && user.uid === userId && navigator.onLine) {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}`);
    }
  }
}

export async function syncProfileToCloud(profile: HealthProfile): Promise<void> {
  await saveLocalProfile(profile);
  const user = auth.currentUser;
  if (!user || !user.emailVerified || profile.userId !== user.uid || !navigator.onLine) {
    return;
  }
  const path = `users/${user.uid}/private/profile`;
  const ref = doc(db, 'users', user.uid, 'private', 'profile');
  try {
    const snap = await getDoc(ref);
    const payload = {
      userId: user.uid,
      fullName: (profile.fullName || '').slice(0, 120),
      age: String(profile.age || '').slice(0, 20),
      gender: profile.gender || '',
      bloodType: (profile.bloodType || '').slice(0, 16),
      chronicConditions: (profile.chronicConditions || []).slice(0, 40),
      currentMedications: (profile.currentMedications || []).slice(0, 40),
      allergies: (profile.allergies || []).slice(0, 40),
      pastMedicalHistory: (profile.pastMedicalHistory || '').slice(0, 2000),
      emergencyContact: (profile.emergencyContact || '').slice(0, 120),
      preferredLanguage: profile.preferredLanguage || 'ar',
      localUpdatedAt: profile.localUpdatedAt.slice(0, 64),
    };
    if (snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: snap.data().createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Profile cloud sync failed (saved locally):', err);
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function fetchProfileFromCloud(uid: string, defaultLang: Language): Promise<HealthProfile> {
  const local = await getLocalProfile(uid, defaultLang);
  const user = auth.currentUser;
  if (!user || user.uid !== uid || !navigator.onLine) return local;

  const path = `users/${uid}/private/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (snap.exists()) {
      const data = snap.data() as HealthProfile;
      const merged = { ...local, ...data, userId: uid };
      await saveLocalProfile(merged);
      return merged;
    }
    return local;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch {
        // ignore and return local
      }
    }
    return local;
  }
}

export async function wipeAllUserData(userId: string): Promise<void> {
  const reports = await getLocalReports(userId);
  localStorage.removeItem(`${LS_REPORTS_PREFIX}${userId}`);
  localStorage.removeItem(`${LS_PROFILE_PREFIX}${userId}`);

  const database = await openDB();
  if (database) {
    await new Promise<void>((resolve) => {
      try {
        const tx = database.transaction([STORE_REPORTS, STORE_PROFILES], 'readwrite');
        const repStore = tx.objectStore(STORE_REPORTS);
        for (const r of reports) repStore.delete(r.id);
        tx.objectStore(STORE_PROFILES).delete(userId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  const user = auth.currentUser;
  if (user && user.uid === userId && navigator.onLine) {
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'reports'), where('userId', '==', uidOrFallback(userId)));
      const snap = await getDocs(q);
      snap.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'users', userId, 'private', 'profile'));
      await batch.commit();
    } catch (err) {
      console.warn('Cloud wipe partial error:', err);
    }
  }
}

function uidOrFallback(uid: string): string {
  return uid || 'none';
}

export async function submitUserFeedback(feedback: UserFeedback): Promise<void> {
  try {
    const key = 'doctor_ai_feedback_local';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(feedback);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
  } catch {
    // ignore
  }

  const user = auth.currentUser;
  if (user && user.emailVerified && navigator.onLine) {
    const path = `feedback/${feedback.id}`;
    try {
      await setDoc(doc(db, 'feedback', feedback.id), {
        id: feedback.id,
        userId: user.uid,
        rating: feedback.rating,
        category: feedback.category,
        comment: feedback.comment.slice(0, 1500),
        localCreatedAt: feedback.localCreatedAt,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
}
