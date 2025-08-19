import React, { useState } from 'react';
import { StoredConversation, SkillMatchingResult, InterviewSession } from '../types';
import ConversationDetailModal from './ConversationDetailModal';
import SkillMatchingModal from './SkillMatchingModal';
import InterviewDetailModal from '../components/InterviewDetailModal'; // Import the new modal
import { performSkillMatching } from '../services/geminiService';
import TargetIcon from './icons/TargetIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ChatIcon from './icons/ChatIcon';

interface UserDashboardProps {
  conversations: StoredConversation[];
  interviews: InterviewSession[];
  onNewChat: () => void;
  onNewInterview: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ conversations, interviews, onNewChat, onNewInterview }) => {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSession | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [skillMatchingResult, setSkillMatchingResult] = useState<SkillMatchingResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAITypeDisplay = (conv: StoredConversation) => {
    if (!conv.aiType) return '';
    return conv.aiType === 'human' ? ' (人間)' : ' (犬)';
  };
  
  const handleRunSkillMatching = async () => {
    if (conversations.length === 0) {
        alert("診断には少なくとも1件の相談履歴が必要です。");
        return;
    }
    setIsMatching(true);
    setMatchingError(null);
    setSkillMatchingResult(null);
    setIsMatchingModalOpen(true);
    try {
        const result = await performSkillMatching(conversations);
        setSkillMatchingResult(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
        setMatchingError(`診断中にエラーが発生しました: ${errorMessage}`);
    } finally {
        setIsMatching(false);
    }
};

  return (
    <>
      <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              あなたの活動履歴
            </h1>
             <p className="text-sm text-slate-500 mt-1">過去の相談や模擬面接を確認し、キャリア活動を始めましょう。</p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
                onClick={handleRunSkillMatching}
                disabled={isMatching || conversations.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <TargetIcon />
                適性診断
            </button>
             <button
                onClick={onNewInterview}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-200"
              >
                <BriefcaseIcon />
                模擬面接
            </button>
            <button
              onClick={onNewChat}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-200"
            >
              <ChatIcon />
              キャリア相談
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-4 -mr-6 pr-6 -ml-6 pl-6">
          {conversations.length === 0 && interviews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 rounded-lg bg-slate-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-bold text-slate-700">まだ活動履歴がありません</h3>
              <p className="mt-2 text-sm max-w-md">
                「キャリア相談」や「模擬面接」でAIアシスタントとの対話を始めましょう。
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {conversations.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-700 mb-2 pl-4">キャリア相談履歴</h2>
                  <div className="space-y-2">
                    {[...conversations].reverse().map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full text-left p-4 rounded-lg hover:bg-slate-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <p className="font-semibold text-slate-700">{formatDate(conv.date)}</p>
                        <p className="text-sm text-slate-500">担当AI: {conv.aiName}{getAITypeDisplay(conv)}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
               {interviews.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-700 mb-2 pl-4">模擬面接履歴</h2>
                  <div className="space-y-2">
                    {[...interviews].reverse().map(interview => (
                      <button
                        key={interview.id}
                        onClick={() => setSelectedInterview(interview)}
                        className="w-full text-left p-4 rounded-lg hover:bg-slate-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <p className="font-semibold text-slate-700">{formatDate(interview.date)}</p>
                        <p className="text-sm text-slate-500">対象職種: {interview.jobTitle}</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}

      {selectedInterview && (
        <InterviewDetailModal
            interview={selectedInterview}
            onClose={() => setSelectedInterview(null)}
        />
      )}

      <SkillMatchingModal
        isOpen={isMatchingModalOpen}
        onClose={() => setIsMatchingModalOpen(false)}
        result={skillMatchingResult}
        isLoading={isMatching}
        error={matchingError}
      />
    </>
  );
};

export default UserDashboard;