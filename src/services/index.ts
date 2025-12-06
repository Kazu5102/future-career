import * as realService from './geminiService';
import * as mockService from './mockGeminiService';
import type { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult } from '../types';

// This file intelligently switches between the real API service and a mock service.
const env = (import.meta as any).env || {};
const isProduction = env.PROD === true;

const service = isProduction ? realService : mockService;

console.log(`[Service Initialized] Using ${isProduction ? 'REAL' : 'MOCK'} service. (isProduction: ${isProduction})`);

export const checkServerStatus = (): Promise<{status: string}> => service.checkServerStatus();
export const getChatResponse = (messages: ChatMessage[], aiType: AIType, aiName: string): Promise<{ text: string }> => service.getChatResponse(messages, aiType, aiName);
export const generateSummary = (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => service.generateSummary(chatHistory, aiType, aiName);
export const reviseSummary = (originalSummary: string, correctionRequest: string): Promise<string> => service.reviseSummary(originalSummary, correctionRequest);
export const analyzeConversations = (summaries: StoredConversation[]): Promise<AnalysisData> => service.analyzeConversations(summaries);
export const analyzeTrajectory = (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => service.analyzeTrajectory(conversations, userId);
export const findHiddenPotential = (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => service.findHiddenPotential(conversations, userId);
export const generateSummaryFromText = (textToAnalyze: string): Promise<string> => service.generateSummaryFromText(textToAnalyze);
export const performSkillMatching = (conversations: StoredConversation[]): Promise<SkillMatchingResult> => service.performSkillMatching(conversations);