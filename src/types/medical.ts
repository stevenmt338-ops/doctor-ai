export type Language = 'ar' | 'en';

export type ReportStatus = 'preliminary' | 'partial' | 'completed';

export type AIAnalysisStatus = 'complete' | 'unavailable' | 'pending';

export type UrgencyLevel = 'emergency' | 'urgent' | 'soon' | 'routine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  edited?: boolean;
  quickReplies?: string[];
  emergencyAlert?: {
    detected: boolean;
    reason: string;
    immediateAction: string;
  } | null;
}

export interface CollectedClinicalData {
  chiefComplaint: string;
  symptoms: string[];
  painLocation: string;
  onsetTime: string;
  duration: string;
  severity: string;
  pattern: string;
  associatedSymptoms: string[];
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  medicalHistory: string;
  notes: string;
  missingInfo: string[];
}

export interface PossibleConsideration {
  condition: string;
  reasoning: string;
  likelihoodNote: string;
}

export interface AIAnalysisResult {
  organizedSummary: string;
  possibleConsiderations: PossibleConsideration[];
  urgencyLevel: UrgencyLevel;
  urgencyExplanation: string;
  missingInformation: string[];
  safeGuidance: string[];
  whenToSeeDoctor: string[];
  whenToSeekEmergency: string[];
  redFlagsDetected: boolean;
  generatedAt: string;
}

export interface PatientSnapshot {
  age: string;
  gender: 'male' | 'female' | 'other' | '';
}

export interface MedicalReport {
  id: string;
  userId: string; // 'guest' when unauthenticated, or Firebase UID when authenticated
  referenceNumber: string;
  title: string;
  status: ReportStatus;
  aiAnalysisStatus: AIAnalysisStatus;
  language: Language;
  patientSnapshot: PatientSnapshot;
  collectedData: CollectedClinicalData;
  aiAnalysis: AIAnalysisResult | null;
  messages: ChatMessage[];
  progressPercent: number;
  version: number;
  syncStatus: 'synced' | 'pending' | 'local_only' | 'error';
  localCreatedAt: string;
  localUpdatedAt: string;
}

export interface HealthProfile {
  userId: string;
  fullName: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  bloodType: string;
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  pastMedicalHistory: string;
  emergencyContact: string;
  preferredLanguage: Language;
  localUpdatedAt: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  rating: number;
  category: 'accuracy' | 'design' | 'pdf' | 'general';
  comment: string;
  localCreatedAt: string;
}

export type AppView =
  | 'home'
  | 'consultation'
  | 'report'
  | 'reports'
  | 'profile'
  | 'compare'
  | 'about'
  | 'help'
  | 'privacy'
  | 'terms'
  | 'disclaimer'
  | 'feedback';
