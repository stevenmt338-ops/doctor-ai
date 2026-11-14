import {
  AIAnalysisResult,
  ChatMessage,
  CollectedClinicalData,
  HealthProfile,
  Language,
  MedicalReport,
  ReportStatus,
  UrgencyLevel,
} from '../types/medical';

export function createEmptyClinicalData(profile?: HealthProfile | null): CollectedClinicalData {
  return {
    chiefComplaint: '',
    symptoms: [],
    painLocation: '',
    onsetTime: '',
    duration: '',
    severity: '',
    pattern: '',
    associatedSymptoms: [],
    chronicConditions: profile?.chronicConditions ? [...profile.chronicConditions] : [],
    currentMedications: profile?.currentMedications ? [...profile.currentMedications] : [],
    allergies: profile?.allergies ? [...profile.allergies] : [],
    medicalHistory: profile?.pastMedicalHistory || '',
    notes: '',
    missingInfo: [],
  };
}

export function detectEmergencyRedFlags(
  text: string,
  lang: Language
): { detected: boolean; reason: string; immediateAction: string } {
  const lower = text.toLowerCase();

  const patterns: { regex: RegExp; reasonAr: string; reasonEn: string }[] = [
    {
      regex: /(ألم\s*(شديد|حاد|ضاغط)?\s*(في|ب)?\s*الصدر|الم\s*الصدر|وجع\s*في\s*الصدر|ضغط\s*على\s*الصدر|chest\s*pain|chest\s*tightness|crushing\s*chest)/i,
      reasonAr: 'تم رصد ذكر ألم أو ضغط في الصدر، وهي علامة قد تتطلب تقييمًا إسعافيًا فوريًا للقلب أو الرئتين.',
      reasonEn: 'Chest pain or pressure was mentioned, which can require immediate emergency cardiac or pulmonary evaluation.',
    },
    {
      regex: /(صعوبة\s*(شديدة)?\s*(في)?\s*التنفس|ضيق\s*(شديد)?\s*(في)?\s*التنفس|اختناق|مش\s*قادر\s*اتنفس|لا\s*أستطيع\s*التنفس|shortness\s*of\s*breath|can't\s*breathe|severe\s*dyspnea|difficulty\s*breathing)/i,
      reasonAr: 'تم رصد صعوبة أو ضيق شديد في التنفس، وهو عرض عاجل يستدعي التوجه للطوارئ فورًا.',
      reasonEn: 'Severe shortness of breath or breathing difficulty was reported, requiring urgent emergency care.',
    },
    {
      regex: /(فقدان\s*الوعي|إغماء|اغماء|أغمى\s*علي|تشنجات|نوبة\s*صرع|fainted|loss\s*of\s*consciousness|passed\s*out|seizure)/i,
      reasonAr: 'تم رصد ذكر فقدان للوعي أو إغماء أو تشنجات، وهي حالة تستدعي تقييمًا طبيًا طارئًا فورًا.',
      reasonEn: 'Loss of consciousness, fainting, or seizures were mentioned, requiring immediate emergency assessment.',
    },
    {
      regex: /(تلعثم|ثقل\s*في\s*اللسان|تنميل\s*مفاجئ\s*في\s*نصف|شلل|عدم\s*القدرة\s*على\s*تحريك|slurred\s*speech|facial\s*droop|sudden\s*weakness)/i,
      reasonAr: 'توجد علامات عصبية حادة محتملة (مثل ثقل اللسان أو ضعف مفاجئ)، يجب التوجه فورًا للطوارئ.',
      reasonEn: 'Potential acute neurological symptoms were mentioned; seek immediate emergency evaluation.',
    },
    {
      regex: /(نزيف\s*شديد|قيء\s*دم|تقيؤ\s*دم|براز\s*أسود|severe\s*bleeding|vomiting\s*blood|coughing\s*blood)/i,
      reasonAr: 'تم ذكر نزيف حاد أو قيء دموي، وهو ما يستلزم التوجه الفوري لقسم الطوارئ.',
      reasonEn: 'Severe bleeding or vomiting blood was mentioned, requiring immediate emergency attention.',
    },
  ];

  for (const p of patterns) {
    if (p.regex.test(lower)) {
      return {
        detected: true,
        reason: lang === 'ar' ? p.reasonAr : p.reasonEn,
        immediateAction:
          lang === 'ar'
            ? 'يرجى الاتصال بالإسعاف أو التوجه لأقرب قسم طوارئ فورًا وعدم تأجيل الرعاية الطبية.'
            : 'Please call emergency services or go to the nearest emergency department immediately without delay.',
      };
    }
  }

  return { detected: false, reason: '', immediateAction: '' };
}

export function extractClinicalDataLocally(
  messages: ChatMessage[],
  existing: CollectedClinicalData,
  profile: HealthProfile | null,
  lang: Language
): CollectedClinicalData {
  const userMessages = messages.filter((m) => m.role === 'user');
  const combined = userMessages.map((m) => m.content.trim()).join('\n');
  const next: CollectedClinicalData = {
    ...existing,
    symptoms: [...(existing.symptoms || [])],
    associatedSymptoms: [...(existing.associatedSymptoms || [])],
    chronicConditions:
      existing.chronicConditions?.length
        ? [...existing.chronicConditions]
        : profile?.chronicConditions
        ? [...profile.chronicConditions]
        : [],
    currentMedications:
      existing.currentMedications?.length
        ? [...existing.currentMedications]
        : profile?.currentMedications
        ? [...profile.currentMedications]
        : [],
    allergies:
      existing.allergies?.length
        ? [...existing.allergies]
        : profile?.allergies
        ? [...profile.allergies]
        : [],
    medicalHistory: existing.medicalHistory || profile?.pastMedicalHistory || '',
  };

  if (!next.chiefComplaint && userMessages.length > 0) {
    next.chiefComplaint = userMessages[0].content.trim().slice(0, 220);
  }

  // Extract common symptoms
  const symptomDictionary: { regex: RegExp; ar: string; en: string }[] = [
    { regex: /(صداع|headache)/i, ar: 'صداع', en: 'Headache' },
    { regex: /(دوخة|دوار|dizziness|vertigo)/i, ar: 'دوخة / دوار', en: 'Dizziness' },
    { regex: /(حرارة|سخونية|حمى|fever)/i, ar: 'ارتفاع حرارة', en: 'Fever' },
    { regex: /(كحة|سعال|cough)/i, ar: 'كحة / سعال', en: 'Cough' },
    { regex: /(بطن|مغص|معدة|abdom|stomach)/i, ar: 'ألم في البطن', en: 'Abdominal pain' },
    { regex: /(ظهر|أسفل الظهر|back pain)/i, ar: 'ألم في الظهر', en: 'Back pain' },
    { regex: /(صدر|chest)/i, ar: 'ألم أو ضيق في الصدر', en: 'Chest discomfort' },
    { regex: /(تنفس|ضيق نفس|shortness of breath|breath)/i, ar: 'ضيق في التنفس', en: 'Shortness of breath' },
    { regex: /(إرهاق|تعب|خمول|fatigue|tired)/i, ar: 'إرهاق عام', en: 'Fatigue' },
    { regex: /(غثيان|قيء|استفراغ|nausea|vomit)/i, ar: 'غثيان / قيء', en: 'Nausea / Vomiting' },
    { regex: /(إسهال|diarrhea)/i, ar: 'إسهال', en: 'Diarrhea' },
    { regex: /(حلق|بلع|زور|sore throat)/i, ar: 'ألم في الحلق', en: 'Sore throat' },
  ];

  for (const s of symptomDictionary) {
    if (s.regex.test(combined)) {
      const label = lang === 'ar' ? s.ar : s.en;
      if (!next.symptoms.includes(label)) {
        next.symptoms.push(label);
      }
    }
  }

  if (next.symptoms.length === 0 && next.chiefComplaint) {
    next.symptoms = [next.chiefComplaint.slice(0, 80)];
  }

  // Extract severity (e.g. "7", "7/10", "شديد", "متوسط", "خفيف")
  const numSeverityMatch = combined.match(/\b(10|[1-9])\s*(?:\/\s*10|من\s*10)?\b/);
  if (numSeverityMatch && !next.severity) {
    next.severity = `${numSeverityMatch[1]}/10`;
  } else if (!next.severity) {
    if (/(شديد|قوي|لا يحتمل|severe|intense)/i.test(combined)) {
      next.severity = lang === 'ar' ? 'شديد (وفق وصف المستخدم)' : 'Severe (user-described)';
    } else if (/(متوسط|moderate)/i.test(combined)) {
      next.severity = lang === 'ar' ? 'متوسط' : 'Moderate';
    } else if (/(خفيف|بسيط|mild)/i.test(combined)) {
      next.severity = lang === 'ar' ? 'خفيف' : 'Mild';
    }
  }

  // Extract location
  if (!next.painLocation) {
    const locMatches: { regex: RegExp; ar: string; en: string }[] = [
      { regex: /(الرأس|الراس|الصدغ|الجبهة|head|forehead|temple)/i, ar: 'الرأس', en: 'Head' },
      { regex: /(البطن|المعدة|أعلى البطن|أسفل البطن|abdomen|stomach)/i, ar: 'البطن', en: 'Abdomen' },
      { regex: /(الصدر|chest)/i, ar: 'الصدر', en: 'Chest' },
      { regex: /(الظهر|أسفل الظهر|back|lower back)/i, ar: 'الظهر', en: 'Back' },
      { regex: /(الحلق|الزور|throat)/i, ar: 'الحلق', en: 'Throat' },
    ];
    for (const loc of locMatches) {
      if (loc.regex.test(combined)) {
        next.painLocation = lang === 'ar' ? loc.ar : loc.en;
        break;
      }
    }
  }

  // Extract onset/duration
  if (!next.duration) {
    const durMatch = combined.match(
      /(منذ\s+[^\n،.]{2,35}|بقالي\s+[^\n،.]{2,35}|لها\s+[^\n،.]{2,35}|(\d+)\s*(ساعة|ساعات|يوم|أيام|ايام|أسبوع|أسابيع|شهر|hours?|days?|weeks?|months?))/i
    );
    if (durMatch) {
      next.duration = durMatch[0].trim();
      if (!next.onsetTime) next.onsetTime = durMatch[0].trim();
    } else if (/(اليوم|أمس|امبارح|البارحة|today|yesterday)/i.test(combined)) {
      const m = combined.match(/(اليوم|أمس|امبارح|البارحة|today|yesterday)/i);
      if (m) next.onsetTime = m[0];
    }
  }

  // Extract pattern
  if (!next.pattern) {
    if (/(مستمر|طوال الوقت|لا يتوقف|continuous|constant)/i.test(combined)) {
      next.pattern = lang === 'ar' ? 'مستمر' : 'Continuous';
    } else if (/(متقطع|يروح ويجي|من وقت لآخر|intermittent|comes and goes)/i.test(combined)) {
      next.pattern = lang === 'ar' ? 'متقطع' : 'Intermittent';
    }
  }

  // Compute missing info list honestly
  const missing: string[] = [];
  if (!next.onsetTime && !next.duration) {
    missing.push(lang === 'ar' ? 'وقت بداية الأعراض ومدتها بدقة' : 'Exact onset time and duration');
  }
  if (!next.painLocation) {
    missing.push(lang === 'ar' ? 'الموقع الدقيق للألم أو الانزعاج' : 'Exact location of pain/discomfort');
  }
  if (!next.severity) {
    missing.push(lang === 'ar' ? 'شدة الأعراض على مقياس من 1 إلى 10' : 'Symptom severity on a 1–10 scale');
  }
  if (!next.pattern) {
    missing.push(lang === 'ar' ? 'نمط الأعراض (مستمر أم متقطع)' : 'Symptom pattern (continuous vs intermittent)');
  }
  if (next.chronicConditions.length === 0 && !/(لا توجد أمراض|ما عندي أمراض|سليم|no chronic)/i.test(combined)) {
    missing.push(lang === 'ar' ? 'تأكيد وجود أو عدم وجود أمراض مزمنة' : 'Confirmation of chronic medical conditions');
  }
  if (next.currentMedications.length === 0 && !/(لا أتناول|مفيش أدوية|no medications)/i.test(combined)) {
    missing.push(lang === 'ar' ? 'الأدوية المستخدمة حاليًا' : 'Current medications');
  }
  if (next.allergies.length === 0 && !/(لا توجد حساسية|مفيش حساسية|no allergies)/i.test(combined)) {
    missing.push(lang === 'ar' ? 'الحساسية الدوائية أو الغذائية' : 'Medication or food allergies');
  }
  next.missingInfo = missing;

  return next;
}

export function getNextFallbackQuestion(
  data: CollectedClinicalData,
  messages: ChatMessage[],
  lang: Language
): { reply: string; quickReplies: string[]; progressPercent: number; isReadyForReport: boolean } {
  const assistantHistory = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n');

  const answeredCount = [
    Boolean(data.chiefComplaint),
    Boolean(data.onsetTime || data.duration),
    Boolean(data.painLocation),
    Boolean(data.severity),
    Boolean(data.pattern),
    data.chronicConditions.length > 0 || /(أمراض مزمنة|chronic)/i.test(assistantHistory),
    data.currentMedications.length > 0 || /(أدوية|medications)/i.test(assistantHistory),
    data.allergies.length > 0 || /(حساسية|allergies)/i.test(assistantHistory),
  ].filter(Boolean).length;

  const progressPercent = Math.min(100, Math.max(15, Math.round((answeredCount / 8) * 100)));

  if (!data.onsetTime && !data.duration && !/(متى بدأت|when did)/i.test(assistantHistory)) {
    return {
      reply:
        lang === 'ar'
          ? 'شكرًا لتوضيح الأعراض. متى بدأت هذه الأعراض تحديدًا، وكم مضى على استمرارها؟'
          : 'Thank you for sharing your symptoms. When did they start, and how long have they lasted?',
      quickReplies:
        lang === 'ar'
          ? ['منذ ساعات قليلة اليوم', 'منذ يوم إلى 3 أيام', 'منذ أكثر من أسبوع']
          : ['A few hours ago today', '1 to 3 days ago', 'Over a week ago'],
      progressPercent,
      isReadyForReport: false,
    };
  }

  if (!data.painLocation && !/(أين تشعر|where do you feel)/i.test(assistantHistory)) {
    return {
      reply:
        lang === 'ar'
          ? 'أين تشعر بالألم أو الانزعاج تحديدًا، وهل ينتقل لمكان آخر؟'
          : 'Where exactly do you feel the pain or discomfort, and does it radiate anywhere?',
      quickReplies:
        lang === 'ar'
          ? ['في موضع واحد محدد', 'ينتشر في أكثر من مكان', 'لا يوجد ألم موضعي']
          : ['In one localized area', 'Spreads to other areas', 'No localized pain'],
      progressPercent,
      isReadyForReport: false,
    };
  }

  if (!data.severity && !/(شدة الألم|severity|1 إلى 10)/i.test(assistantHistory)) {
    return {
      reply:
        lang === 'ar'
          ? 'على مقياس من 1 إلى 10 (حيث 10 هو الأشد)، ما مدى شدة الأعراض حاليًا؟'
          : 'On a scale from 1 to 10 (10 being most severe), how intense are your symptoms right now?',
      quickReplies:
        lang === 'ar'
          ? ['خفيف (1–3 من 10)', 'متوسط (4–6 من 10)', 'شديد (7–10 من 10)']
          : ['Mild (1–3 / 10)', 'Moderate (4–6 / 10)', 'Severe (7–10 / 10)'],
      progressPercent,
      isReadyForReport: false,
    };
  }

  if (!data.pattern && !/(مستمر|متقطع|continuous)/i.test(assistantHistory)) {
    return {
      reply:
        lang === 'ar'
          ? 'هل الأعراض مستمرة طوال الوقت أم تأتي بشكل متقطع، وهل تزداد مع مجهود أو وقت معين؟'
          : 'Are the symptoms continuous or do they come and go, and does anything worsen or relieve them?',
      quickReplies:
        lang === 'ar'
          ? ['مستمرة طوال الوقت', 'متقطعة وتأتي على فترات', 'تزداد مع الحركة أو المجهود']
          : ['Continuous', 'Intermittent / comes and goes', 'Worse with activity'],
      progressPercent,
      isReadyForReport: false,
    };
  }

  if (data.chronicConditions.length === 0 && !/(أمراض مزمنة|chronic conditions)/i.test(assistantHistory)) {
    return {
      reply:
        lang === 'ar'
          ? 'هل لديك أي أمراض مزمنة (مثل الضغط أو السكري أو الربو)، أو تتناول أدوية بانتظام، أو تعاني من حساسية تجاه أدوية معينة؟'
          : 'Do you have any chronic conditions, take regular medications, or have any medication allergies?',
      quickReplies:
        lang === 'ar'
          ? ['لا توجد أمراض مزمنة أو أدوية أو حساسية', 'نعم، سأذكرها الآن']
          : ['No chronic conditions, medications, or allergies', 'Yes, I will list them now'],
      progressPercent,
      isReadyForReport: answeredCount >= 4,
    };
  }

  return {
    reply:
      lang === 'ar'
        ? 'تم توثيق بياناتك الأساسية بنجاح. يمكنك الآن عرض التقرير الصحي المنظم وتنزيله بصيغة PDF أو إضافة أي تفاصيل إضافية.'
        : 'Your core clinical details have been documented. You can now view and download your structured PDF medical report or add any extra notes.',
    quickReplies: [],
    progressPercent: Math.max(progressPercent, 85),
    isReadyForReport: true,
  };
}

export function computeReportStatus(
  data: CollectedClinicalData,
  aiAnalysis: AIAnalysisResult | null,
  messages: ChatMessage[]
): ReportStatus {
  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  if (userMessagesCount === 0 && !data.chiefComplaint) {
    return 'preliminary';
  }

  const filledCoreFields = [
    Boolean(data.chiefComplaint),
    Boolean(data.onsetTime || data.duration),
    Boolean(data.painLocation),
    Boolean(data.severity),
    Boolean(data.pattern),
  ].filter(Boolean).length;

  if (filledCoreFields >= 4 && aiAnalysis !== null) {
    return 'completed';
  }
  if (filledCoreFields >= 2 || userMessagesCount >= 2) {
    return 'partial';
  }
  return 'preliminary';
}

export function buildFallbackAnalysis(
  report: MedicalReport,
  lang: Language
): AIAnalysisResult {
  const { collectedData, messages } = report;
  const combined = messages.map((m) => m.content).join(' ');
  const emergency = detectEmergencyRedFlags(combined, lang);

  let urgencyLevel: UrgencyLevel = 'soon';
  if (emergency.detected) {
    urgencyLevel = 'emergency';
  } else if (/([7-9]|10)\s*\/\s*10|شديد|severe/i.test(collectedData.severity)) {
    urgencyLevel = 'urgent';
  } else if (/(خفيف|1|2|3|mild)/i.test(collectedData.severity)) {
    urgencyLevel = 'routine';
  }

  const summaryParts: string[] = [];
  if (collectedData.chiefComplaint) {
    summaryParts.push(
      lang === 'ar'
        ? `الشكوى الرئيسية المبلغ عنها: ${collectedData.chiefComplaint}.`
        : `Reported chief complaint: ${collectedData.chiefComplaint}.`
    );
  }
  if (collectedData.painLocation) {
    summaryParts.push(
      lang === 'ar'
        ? `الموقع المذكور: ${collectedData.painLocation}.`
        : `Reported location: ${collectedData.painLocation}.`
    );
  }
  if (collectedData.duration || collectedData.onsetTime) {
    summaryParts.push(
      lang === 'ar'
        ? `المدة / البداية: ${collectedData.duration || collectedData.onsetTime}.`
        : `Duration / Onset: ${collectedData.duration || collectedData.onsetTime}.`
    );
  }
  if (collectedData.severity) {
    summaryParts.push(
      lang === 'ar'
        ? `الشدة المبلغ عنها: ${collectedData.severity}.`
        : `Reported severity: ${collectedData.severity}.`
    );
  }

  return {
    organizedSummary:
      summaryParts.length > 0
        ? summaryParts.join(' ') +
          (lang === 'ar'
            ? ' (ملاحظة: التحليل الذكي بالذكاء الاصطناعي غير مكتمل حاليًا؛ تم تنظيم هذا الملخص مباشرة من إجاباتك المحفوظة).'
            : ' (Note: AI clinical analysis is currently incomplete; this summary was organized directly from your saved responses).')
        : lang === 'ar'
        ? 'تقرير أولي مبني على البيانات المتاحة فقط؛ التحليل الذكي غير مكتمل.'
        : 'Preliminary report built from available data only; AI analysis is incomplete.',
    possibleConsiderations: [],
    urgencyLevel,
    urgencyExplanation:
      urgencyLevel === 'emergency'
        ? emergency.reason
        : lang === 'ar'
        ? 'تم تحديد درجة الاستعجال الأولية استنادًا إلى المعلومات المتوفرة فقط، ويُنصح بمراجعة طبيب للتقييم السريري.'
        : 'Initial urgency level was estimated from available details only; direct clinical evaluation is advised.',
    missingInformation:
      collectedData.missingInfo.length > 0
        ? collectedData.missingInfo
        : [
            lang === 'ar'
              ? 'استكمال التحليل الذكي والفحص السريري المباشر لدى الطبيب'
              : 'Completion of AI analysis and direct clinical examination by a physician',
          ],
    safeGuidance:
      lang === 'ar'
        ? [
            'الحفاظ على الراحة وتجنب المجهود البدني الشاق حتى مراجعة الطبيب.',
            'شرب كميات كافية من السوائل ما لم تكن هناك موانع طبية.',
            'عدم تناول أي أدوية مسكنة أو مضادات حيوية دون استشارة طبية، خاصة مع وجود أمراض مزمنة أو حساسية.',
            'مراقبة تطور الأعراض وتدوين أي تغيرات جديدة لعرضها على الطبيب.',
          ]
        : [
            'Rest and avoid strenuous activity until evaluated by a clinician.',
            'Stay adequately hydrated unless medically restricted.',
            'Avoid self-medicating without medical advice, especially if you have chronic conditions or allergies.',
            'Monitor symptom progression and note any new changes for your doctor.',
          ],
    whenToSeeDoctor:
      lang === 'ar'
        ? [
            'استمرار الأعراض دون تحسن أو ازدياد شدتها تدريجيًا.',
            'تأثير الأعراض على النوم أو القدرة على ممارسة الأنشطة اليومية.',
            'ظهور أعراض جديدة مثل ارتفاع الحرارة أو قيء متكرر.',
          ]
        : [
            'Symptoms persist without improvement or progressively worsen.',
            'Symptoms interfere with sleep or daily functioning.',
            'Appearance of new symptoms such as fever or repeated vomiting.',
          ],
    whenToSeekEmergency:
      lang === 'ar'
        ? [
            'ألم أو ضغط مفاجئ في الصدر.',
            'صعوبة شديدة في التنفس أو تسارع غير معتاد في النفس.',
            'فقدان الوعي، أو دوخة شديدة مفاجئة، أو تشنجات.',
            'ضعف مفاجئ في أحد جانبي الجسم أو تلعثم في الكلام.',
          ]
        : [
            'Sudden chest pain or pressure.',
            'Severe difficulty breathing.',
            'Loss of consciousness, fainting, or seizures.',
            'Sudden weakness on one side of the body or slurred speech.',
          ],
    redFlagsDetected: emergency.detected,
    generatedAt: new Date().toISOString(),
  };
}

export function mergeClinicalData(
  base: CollectedClinicalData,
  incoming: Partial<CollectedClinicalData>
): CollectedClinicalData {
  const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
  return {
    chiefComplaint: incoming.chiefComplaint?.trim() || base.chiefComplaint,
    symptoms: uniq([...(base.symptoms || []), ...(incoming.symptoms || [])]),
    painLocation: incoming.painLocation?.trim() || base.painLocation,
    onsetTime: incoming.onsetTime?.trim() || base.onsetTime,
    duration: incoming.duration?.trim() || base.duration,
    severity: incoming.severity?.trim() || base.severity,
    pattern: incoming.pattern?.trim() || base.pattern,
    associatedSymptoms: uniq([
      ...(base.associatedSymptoms || []),
      ...(incoming.associatedSymptoms || []),
    ]),
    chronicConditions: uniq([
      ...(base.chronicConditions || []),
      ...(incoming.chronicConditions || []),
    ]),
    currentMedications: uniq([
      ...(base.currentMedications || []),
      ...(incoming.currentMedications || []),
    ]),
    allergies: uniq([...(base.allergies || []), ...(incoming.allergies || [])]),
    medicalHistory: incoming.medicalHistory?.trim() || base.medicalHistory,
    notes: incoming.notes?.trim() || base.notes,
    missingInfo:
      Array.isArray(incoming.missingInfo) && incoming.missingInfo.length > 0
        ? uniq(incoming.missingInfo)
        : base.missingInfo,
  };
}

export function generateReferenceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DAI-${y}${m}${d}-${rand}`;
}

export function generateSafeId(prefix = 'rep'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}
