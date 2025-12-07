
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult } from '../types';

// UPDATED: Point to the new, robust API endpoint
const PROXY_API_ENDPOINT = '/api/chat'; 

async function fetchFromProxy(action: string, payload: any, timeout: number = 120000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); 

    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
            signal: controller.signal, 
        });
    
        clearTimeout(timeoutId); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); 
            const errorMessage = errorData.details || errorData.error || `Status ${response.status}`;
            
            // Pass through the server message directly for better clarity
            throw new Error(errorMessage);
        }
        
        return response.json();

    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

export const checkServerStatus = async (): Promise<{status: string}> => {
    return fetchFromProxy('healthCheck', {}, 5000);
};

export const getChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string): Promise<{ text: string }> => {
    try {
        return await fetchFromProxy('getChatResponse', { messages, aiType, aiName });
    } catch (error) {
        console.error("Chat error:", error);
        // Just pass the error message directly so user sees "ALL_MODELS_BUSY" or specific errors
        throw error;
    }
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => {
    const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName });
    return data.text;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    const data = await fetchFromProxy('reviseSummary', { originalSummary, correctionRequest });
    return data.text;
};

// --- RESTORED ANALYSIS FUNCTIONS ---

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    const data = await fetchFromProxy('analyzeConversations', { summaries });
    return data; // Expecting JSON object matching AnalysisData
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    const data = await fetchFromProxy('analyzeTrajectory', { conversations, userId });
    return data; // Expecting JSON object
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
     const data = await fetchFromProxy('findHiddenPotential', { conversations, userId });
     return data; // Expecting JSON object
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
     const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze });
     return data.text;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
     const data = await fetchFromProxy('performSkillMatching', { conversations });
     return data; // Expecting JSON object
};
