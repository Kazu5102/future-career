import { ChatMessage, StoredConversation, AnalysisData, AIType, IndividualAnalysisData, SkillMatchingResult } from '../types';

const API_ENDPOINT = '/api/gemini'; // The path to our Vercel serverless function

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ details: response.statusText }));
        throw new Error(`API Error (${response.status}): ${errorData.details || 'Unknown error'}`);
    }
    return response;
};

// --- API Functions ---

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array> | null> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'chat',
                payload: { messages, aiType, aiName }
            }),
            signal, // Pass the AbortSignal to the fetch request
        });
        const checkedResponse = await handleApiResponse(response);
        return checkedResponse.body;
    } catch (error) {
        console.error("Streaming chat API error:", error);
        if (error instanceof Error && error.name === 'AbortError') {
            throw error; // Re-throw AbortError to be handled by the caller
        }
        throw new Error(`Gemini APIとの通信に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'summarize',
                payload: { chatHistory, aiType, aiName }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("サマリー生成APIの呼び出しに失敗しました。");
    }
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
     try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'revise',
                payload: { originalSummary, correctionRequest }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.text;
    } catch (error)
    {
        console.error("Error revising summary:", error);
        throw new Error("サマリー修正APIの呼び出しに失敗しました。");
    }
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'analyze',
                payload: { summaries }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.analysis;
    } catch (error) {
         console.error("Error generating analysis:", error);
        throw new Error(`総合分析APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const analyzeIndividualConversations = async (conversations: StoredConversation[], userId: string): Promise<IndividualAnalysisData> => {
     try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'analyzeIndividual',
                payload: { conversations, userId }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.analysis;
    } catch (error) {
        console.error("Error generating individual analysis:", error);
        throw new Error(`個別分析APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'summarizeText',
                payload: { textToAnalyze }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.text;
    } catch (error) {
        console.error("Error generating summary from text:", error);
        throw new Error("テキストからのサマリー生成に失敗しました。");
    }
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'skillMatch',
                payload: { conversations }
            }),
        });
        const checkedResponse = await handleApiResponse(response);
        const data = await checkedResponse.json();
        return data.result;
    } catch (error) {
        console.error("Error generating skill matching analysis:", error);
        throw new Error(`スキルマッチングAPIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};