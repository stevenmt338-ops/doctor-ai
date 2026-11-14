import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  res.json({
    status: 'ok',
    aiConfigured,
    timestamp: new Date().toISOString(),
  });
});

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

app.post('/api/ai/interview', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'AI service key is not configured on the server.',
      });
    }

    const { messages, collectedData, healthProfile, language } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Messages array is required.' });
    }

    const sanitizedMessages: IncomingMessage[] = messages
      .slice(-30)
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content.trim().slice(0, 2000),
      }));

    const lang = language === 'en' ? 'en' : 'ar';

    const systemInstruction = `You are DOCTOR AI (دكتور AI), an intelligent, empathetic, medically cautious clinical intake assistant.
Language: Respond strictly in ${lang === 'ar' ? 'clear, warm, natural Arabic (العربية الفصحى المبسطة والواضحة)' : 'clear, warm, natural English'}.

CRITICAL CLINICAL & SAFETY RULES:
1. Ask ONE focused, natural follow-up question per turn. Never bombard the user with multiple unrelated questions at once.
2. NEVER repeat questions that have already been answered in the conversation or in the provided collectedData / healthProfile.
3. NEVER assume or invent symptoms, diagnoses, test results, or medical history that the user did not explicitly state.
4. NEVER give a definitive medical diagnosis ("you have X") or prescribe medication dosages.
5. EMERGENCY RED-FLAG OVERRIDE: Immediately check the user's latest message and history for red flags:
   - Chest pain, pressure, tightness, or pain radiating to arm/jaw
   - Severe shortness of breath or inability to speak full sentences
   - Loss of consciousness, fainting, seizures
   - Sudden facial droop, arm weakness, slurred speech (stroke signs)
   - Severe uncontrolled bleeding, severe allergic swelling/anaphylaxis
   - Self-harm or suicidal ideation
   If ANY red flag is present, set emergencyAlert.detected = true immediately, explain clearly why urgent emergency care is needed right now, and do NOT delay this warning to ask routine questions.
6. Extract and merge structured clinical facts accurately from all user messages into extractedData:
   - chiefComplaint, symptoms, painLocation, onsetTime, duration, severity (e.g. "7/10"), pattern (e.g. continuous / intermittent), associatedSymptoms, chronicConditions, currentMedications, allergies, medicalHistory, missingInfo.
   - Keep existing known values unless the user corrected or updated them.
7. Compute realistic progressPercent (10 to 100) based on how many core clinical dimensions are known (chief complaint, onset/duration, location/severity, pattern/associated symptoms, chronic conditions/medications/allergies).
8. Set isReadyForReport = true once at least 4 core clinical dimensions are known OR the user explicitly asks to finish/generate the report.
9. Provide 2-4 helpful, concise suggestedQuickReplies relevant to the single question you just asked (e.g., pain severity ranges or duration options).`;

    const promptPayload = JSON.stringify({
      language: lang,
      knownHealthProfile: healthProfile || null,
      currentCollectedData: collectedData || null,
      conversationHistory: sanitizedMessages,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptPayload,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            emergencyAlert: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN },
                reason: { type: Type.STRING },
                immediateAction: { type: Type.STRING },
              },
              required: ['detected', 'reason', 'immediateAction'],
            },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                chiefComplaint: { type: Type.STRING },
                symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                painLocation: { type: Type.STRING },
                onsetTime: { type: Type.STRING },
                duration: { type: Type.STRING },
                severity: { type: Type.STRING },
                pattern: { type: Type.STRING },
                associatedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                chronicConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
                currentMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
                allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
                medicalHistory: { type: Type.STRING },
                missingInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'chiefComplaint',
                'symptoms',
                'painLocation',
                'onsetTime',
                'duration',
                'severity',
                'pattern',
                'associatedSymptoms',
                'chronicConditions',
                'currentMedications',
                'allergies',
                'medicalHistory',
                'missingInfo',
              ],
            },
            progressPercent: { type: Type.NUMBER },
            isReadyForReport: { type: Type.BOOLEAN },
            suggestedQuickReplies: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedTitle: { type: Type.STRING },
          },
          required: [
            'reply',
            'emergencyAlert',
            'extractedData',
            'progressPercent',
            'isReadyForReport',
            'suggestedQuickReplies',
            'suggestedTitle',
          ],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return res.status(502).json({ error: 'EMPTY_AI_RESPONSE', message: 'Empty response from AI.' });
    }

    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error) {
    console.error('AI interview error:', error);
    return res.status(500).json({
      error: 'AI_INTERVIEW_FAILED',
      message: error instanceof Error ? error.message : 'Failed to process medical interview.',
    });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'AI service key is not configured on the server.',
      });
    }

    const { collectedData, messages, healthProfile, language } = req.body ?? {};
    if (!collectedData && (!Array.isArray(messages) || messages.length === 0)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Clinical data is required.' });
    }

    const lang = language === 'en' ? 'en' : 'ar';

    const systemInstruction = `You are a cautious clinical triage and medical report structuring engine for DOCTOR AI (دكتور AI).
Language: Output strictly in ${lang === 'ar' ? 'formal, clear medical Arabic (العربية الطبية الواضحة)' : 'clear clinical English'}.

STRICT CLINICAL INTEGRITY RULES:
1. Base every statement ONLY on the data provided by the user. NEVER fabricate vital signs, laboratory results, physical exam findings, or diagnoses.
2. NEVER state a definitive diagnosis. Present "possibleConsiderations" strictly as non-conclusive possibilities worth discussing with a physician.
3. NEVER prescribe specific medication dosages or unsafe treatments. Only give safe, conservative general guidance (hydration, rest, monitoring symptoms, avoiding known triggers, avoiding self-medication without a doctor).
4. NEVER falsely reassure the user. If symptoms are incomplete or potentially serious, clearly state the uncertainty and missing information.
5. Set urgencyLevel accurately:
   - "emergency": Red-flag symptoms present (chest pain, severe dyspnea, syncope, acute neurological deficits, severe bleeding, high fever with stiff neck/confusion).
   - "urgent": Severe pain (>= 7/10), persistent high fever, worsening acute symptoms needing same-day/24h evaluation.
   - "soon": Moderate persistent symptoms warranting a scheduled clinic appointment within days.
   - "routine": Mild self-limited symptoms without red flags, monitor and consult if persisting.
6. Explicitly list missingInformation (what a doctor still needs to examine or ask).
7. Always populate whenToSeeDoctor and whenToSeekEmergency with clear, actionable signs.`;

    const payload = JSON.stringify({
      language: lang,
      healthProfile: healthProfile || null,
      collectedData: collectedData || {},
      conversationSummary: Array.isArray(messages)
        ? messages.slice(-25).map((m: IncomingMessage) => `${m.role}: ${String(m.content).slice(0, 600)}`)
        : [],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: payload,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            organizedSummary: { type: Type.STRING },
            possibleConsiderations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  likelihoodNote: { type: Type.STRING },
                },
                required: ['condition', 'reasoning', 'likelihoodNote'],
              },
            },
            urgencyLevel: {
              type: Type.STRING,
              enum: ['emergency', 'urgent', 'soon', 'routine'],
            },
            urgencyExplanation: { type: Type.STRING },
            missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
            safeGuidance: { type: Type.ARRAY, items: { type: Type.STRING } },
            whenToSeeDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
            whenToSeekEmergency: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlagsDetected: { type: Type.BOOLEAN },
            suggestedTitle: { type: Type.STRING },
          },
          required: [
            'organizedSummary',
            'possibleConsiderations',
            'urgencyLevel',
            'urgencyExplanation',
            'missingInformation',
            'safeGuidance',
            'whenToSeeDoctor',
            'whenToSeekEmergency',
            'redFlagsDetected',
            'suggestedTitle',
          ],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return res.status(502).json({ error: 'EMPTY_AI_RESPONSE', message: 'Empty AI analysis response.' });
    }

    const parsed = JSON.parse(rawText);
    return res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({
      error: 'AI_ANALYSIS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to generate medical analysis.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DOCTOR AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
