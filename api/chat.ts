
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PROMPTS FOR ANALYSIS ---

const SYSTEM_PROMPT_JSON = "You are an expert Career Consultant AI. Output ONLY valid JSON. **IMPORTANT: Output all text values in JAPANESE.**";

function getComprehensiveAnalysisPrompt(summaries: any[]) {
    const dataStr = JSON.stringify(summaries.map(s => s.summary));
    return `
    Analyze the following list of career consultation summaries from multiple users.
    Identify overall trends, common challenges, and industry insights.
    **IMPORTANT: All output values MUST be in Japanese.**

    Input Data: ${dataStr}

    Output JSON format matching this interface:
    {
      "keyMetrics": { "totalConsultations": number, "commonIndustries": string[] },
      "commonChallenges": [{ "label": string, "value": number }], // value is approximate percentage
      "careerAspirations": [{ "label": string, "value": number }], // value is approximate percentage
      "commonStrengths": string[],
      "overallInsights": "Markdown string summarizing the analysis (in Japanese)",
      "keyTakeaways": string[]
    }
    `;
}

function getTrajectoryPrompt(conversations: any[], userId: string) {
    const dataStr = JSON.stringify(conversations.map(c => ({ date: c.date, summary: c.summary })));
    return `
    Analyze the career consultation trajectory for user ID: ${userId}.
    Track how their mindset, challenges, and goals have evolved over time based on these session summaries.
    **IMPORTANT: All output values MUST be in Japanese.**

    Input Data: ${dataStr}

    Output JSON format:
    {
      "keyTakeaways": string[],
      "userId": "${userId}",
      "totalConsultations": number,
      "consultations": [{ "dateTime": string, "estimatedDurationMinutes": number }],
      "keyThemes": string[],
      "detectedStrengths": string[],
      "areasForDevelopment": string[],
      "suggestedNextSteps": string[],
      "overallSummary": "Markdown string summarizing the user's journey (in Japanese)"
    }
    `;
}

function getSkillMatchingPrompt(conversations: any[]) {
    const dataStr = JSON.stringify(conversations.map(c => c.summary));
    return `
    Based on the consultation history, analyze the user's aptitude and suggest suitable roles and skills.
    **IMPORTANT: All output values MUST be in Japanese.**

    Input Data: ${dataStr}

    Output JSON format:
    {
      "keyTakeaways": string[],
      "analysisSummary": "Markdown string explaining the aptitude analysis (in Japanese)",
      "recommendedRoles": [{ "role": string, "reason": string, "matchScore": number }], // matchScore 0-100
      "skillsToDevelop": [{ "skill": string, "reason": string }],
      "learningResources": [{ "title": string, "type": "course" | "book" | "article" | "video", "provider": string }]
    }
    `;
}

function getHiddenPotentialPrompt(conversations: any[]) {
    const dataStr = JSON.stringify(conversations.map(c => c.summary));
    return `
    Analyze the consultation history to find "Hidden Potentials" - strengths or interests the user might not have realized themselves. Focus on subtle cues in their values and complaints.
    **IMPORTANT: All output values MUST be in Japanese.**

    Input Data: ${dataStr}

    Output JSON format:
    {
      "hiddenSkills": [{ "skill": string, "reason": string }]
    }
    `;
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { action, payload } = req.body;

        if (action === 'healthCheck') {
            if (!process.env.API_KEY) return res.status(500).json({ status: 'error', message: 'API_KEY_MISSING' });
            return res.status(200).json({ status: 'ok' });
        }

        let model = 'gemini-2.5-flash'; // Default for basic tasks
        let contents: any[] = [];
        let config: any = {};

        // --- 1. Basic Text Tasks ---
        if (action === 'getChatResponse') {
            const { messages, aiType, aiName } = payload;
            const systemPrompt = aiType === 'human' 
                ? `あなたはAIキャリアコンサルタントの${aiName}です。丁寧で共感的な言葉遣いで、ユーザーのキャリアの悩みを傾聴し、整理してください。`
                : `あなたは「キャリア相談わんこ」の${aiName}です。語尾は「ワン！」をつけて、ユーザーの親友として元気に悩みを聞いて、たくさん褒めて励ましてください。`;
            
            config.systemInstruction = systemPrompt;
            
            // Map messages to Gemini Content format
            const recentMessages = messages.slice(-10);
            contents = recentMessages.map((msg: any) => ({
                role: msg.author === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            
            // Use Gemini 2.5 Flash for chat
            model = 'gemini-2.5-flash';
        }
        else if (action === 'generateSummary') {
             const history = payload.chatHistory.map((m: any) => `${m.author}: ${m.text}`).join('\n');
             const prompt = `
            Create a structured career consultation summary (Markdown) for professional consultants.
            **Language: Japanese**
            Sections:
            1. Client Profile & Main Complaint
            2. Self-Concept & Situation (Self-understanding, Job-understanding, Emotions)
            3. Core Issues (Root causes)
            4. Goals & Action Plan (Short/Long term)
            5. Insights for Human Consultant
            
            Chat Log:
            ${history}`;
            contents = [{ role: 'user', parts: [{ text: prompt }] }];
            model = 'gemini-2.5-flash';
        }
        else if (action === 'reviseSummary') {
            contents = [{ role: 'user', parts: [{ text: `Revise this summary in Japanese.\nOriginal:\n${payload.originalSummary}\nRequest:\n${payload.correctionRequest}` }] }];
            model = 'gemini-2.5-flash';
        }
        else if (action === 'generateSummaryFromText') {
             contents = [{ role: 'user', parts: [{ text: `Summarize the following text into a structured career consultation record (Markdown) in Japanese. Focus on Client Profile, Issues, and Goals.\n\nText:\n${payload.textToAnalyze}` }] }];
             model = 'gemini-2.5-flash';
        }
        
        // --- 2. Complex Analysis Tasks (JSON Output) ---
        else if (['analyzeConversations', 'analyzeTrajectory', 'performSkillMatching', 'findHiddenPotential'].includes(action)) {
             // Use Gemini 3 Pro Preview for complex analysis
             model = 'gemini-3-pro-preview';
             config.responseMimeType = 'application/json';
             config.systemInstruction = SYSTEM_PROMPT_JSON;
             
             let prompt = "";
             if (action === 'analyzeConversations') prompt = getComprehensiveAnalysisPrompt(payload.summaries);
             else if (action === 'analyzeTrajectory') prompt = getTrajectoryPrompt(payload.conversations, payload.userId);
             else if (action === 'performSkillMatching') prompt = getSkillMatchingPrompt(payload.conversations);
             else if (action === 'findHiddenPotential') prompt = getHiddenPotentialPrompt(payload.conversations);
             
             contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }
        else {
             return res.status(400).json({ error: 'Invalid action' });
        }

        // Call the Gemini API
        const response = await ai.models.generateContent({
            model,
            contents,
            config
        });

        // Handle Response
        if (config.responseMimeType === 'application/json') {
             const text = response.text;
             if (!text) throw new Error("Empty response from model");
             
             try {
                // Remove Markdown code blocks if present
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return res.status(200).json(JSON.parse(cleanJson));
             } catch (e) {
                 console.error("JSON parse failed", text);
                 return res.status(500).json({ error: "Failed to parse JSON response", raw: text });
             }
        }

        return res.status(200).json({ text: response.text });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
