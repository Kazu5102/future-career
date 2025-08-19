export const STORAGE_VERSION = 2;

export interface StoredData {
  version: number;
  data: StoredConversation[];
  interviews?: InterviewSession[];
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export type AIType = 'human' | 'dog';

export interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string; // e.g. 'human_female_1', 'dog_poodle_1'
  messages: ChatMessage[];
  summary: string;
  date: string;
}

// Types for structured analysis
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalysisData {
  keyMetrics: {
    totalConsultations: number;
    commonIndustries: string[];
  };
  commonChallenges: ChartDataPoint[];
  careerAspirations: ChartDataPoint[];
  commonStrengths: string[];
  overallInsights: string; // Markdown text for summary
}

export interface ConsultationEntry {
    dateTime: string;
    estimatedDurationMinutes: number;
}

export interface IndividualAnalysisData {
  userId: string;
  totalConsultations: number;
  consultations: ConsultationEntry[];
  keyThemes: string[];
  detectedStrengths: string[];
  areasForDevelopment: string[];
  suggestedNextSteps: string[];
  overallSummary: string; // Markdown
  skillMatchingResult: SkillMatchingResult;
  hiddenSkills: SkillToDevelop[];
}

// Types for Skill Matching feature
export interface RecommendedRole {
  role: string;
  reason: string;
  matchScore: number; // A score from 0 to 100
}

export interface SkillToDevelop {
  skill: string;
  reason: string;
}

export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'article' | 'video';
  url: string;
}

export interface SkillMatchingResult {
  analysisSummary: string; // Markdown text
  recommendedRoles: RecommendedRole[];
  skillsToDevelop: SkillToDevelop[];
  learningResources: LearningResource[];
}

// Types for Interview Simulator feature
export enum InterviewMessageAuthor {
    INTERVIEWER = 'interviewer',
    CANDIDATE = 'candidate',
}

export interface InterviewMessage {
    author: InterviewMessageAuthor;
    text: string;
}

export interface QuestionFeedback {
    question: string;
    answer: string;
    analysis: string; // Markdown
    suggestion: string; // Markdown
}

export interface InterviewFeedback {
    overallSummary: string; // Markdown
    strengthAnalysis: string; // Markdown
    improvementAnalysis: string; // Markdown
    questionFeedback: QuestionFeedback[];
}

export interface InterviewSession {
    id: number;
    userId: string;
    jobTitle: string;
    companyContext: string;
    date: string;
    transcript: InterviewMessage[];
    feedback: InterviewFeedback | null;
}
