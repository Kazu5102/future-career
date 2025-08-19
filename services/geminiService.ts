import { ChatMessage, StoredConversation, AnalysisData, AIType, IndividualAnalysisData, SkillMatchingResult } from '../types';

// This is a generic proxy handler.
// In a real-world scenario, you might have different endpoints for different actions.
// For Vercel, if this file is in the `api` directory, it will be automatically deployed.
const PROXY_ENDPOINT = '/api/gemini-proxy';

/**
 * A helper function to handle fetch requests to our backend proxy.
 * @param action The specific action for the proxy to perform.
 * @param payload The data required for that action.
 * @returns The server's response.
 */
async function fetchFromProxy(action: string, payload: unknown) {
    try {
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ details: 'Could not parse error response.' }));
            console.error('Proxy Error Response:', errorData);
            throw new Error(`APIリクエストに失敗しました (ステータス: ${response.status}). ${errorData.details || ''}`);
        }
        return response;
    } catch (error) {
         console.error(`Fetch to proxy failed for action "${action}":`, error);
         if (error instanceof TypeError) { // Network error
            throw new Error("サーバーとの通信に失敗しました。ネットワーク接続を確認してください。");
         }
         throw error; // Re-throw other errors (like the one from !response.ok)
    }
}


// --- API Functions ---

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string): Promise<ReadableStream<Uint8Array> | null> => {
    const response = await fetchFromProxy('chatStream', { messages, aiType, aiName });
    return response.body;
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => {
    const response = await fetchFromProxy('summarize', { chatHistory, aiType, aiName });
    const { text } = await response.json();
    return text;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    const response = await fetchFromProxy('revise', { originalSummary, correctionRequest });
    const { text } = await response.json();
    return text;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    const response = await fetchFromProxy('analyzeConversations', { summaries });
    const data: AnalysisData = await response.json();
    return data;
};

export const analyzeIndividualConversations = async (conversations: StoredConversation[], userId: string): Promise<IndividualAnalysisData> => {
    const response = await fetchFromProxy('analyzeIndividual', { conversations, userId });
    const data: IndividualAnalysisData = await response.json();
    return data;
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const response = await fetchFromProxy('summarizeFromText', { textToAnalyze });
    const { text } = await response.json();
    return text;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    const response = await fetchFromProxy('skillMatching', { conversations });
    const data: SkillMatchingResult = await response.json();
    return data;
};
