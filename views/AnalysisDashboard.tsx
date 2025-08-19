import React, { useState } from 'react';
import { StoredConversation, AnalysisData } from '../types';
import { analyzeConversations } from '../services/geminiService';
import ConversationDetailModal from '../components/ConversationDetailModal';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import AnalysisDisplay from '../components/AnalysisDisplay';

interface Props {
  conversations: StoredConversation[];
  onNewChat: () => void;
}

const AnalysisDashboard: React.FC<Props> = ({ conversations, onNewChat }) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);

  const handleRunAnalysis = async () => {
    if (conversations.length < 2) {
      alert("分析には少なくとも2件の相談履歴が必要です。");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisData(null);
    setError(null);
    try {
      const result = await analyzeConversations(conversations);
      setAnalysisData(result);
    } catch (err) {
      console.error("Failed to generate analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(`分析中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="w-full max-w-6xl h-full flex gap-6 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
        {/* Left Panel: History */}
        <aside className="w-1/3 flex flex-col border-r border-slate-200 pr-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">過去の相談履歴 ({conversations.length}件)</h2>
          <div className="flex-1 overflow-y-auto -mr-6 pr-6 space-y-2">
            {conversations.length > 0 ? (
                [...conversations].reverse().map(conv => (
                  <button 
                    key={conv.id} 
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <p className="font-semibold text-slate-700">{formatDate(conv.date)}</p>
                    <p className="text-sm text-slate-500">担当AI: {conv.aiName}</p>
                  </button>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 rounded-lg bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-lg font-bold text-slate-700">まだ相談履歴がありません</h3>
                  <p className="mt-2 text-sm max-w-xs">AIアシスタントとの対話を通じて、ご自身のキャリアについて考えてみませんか？</p>
                  <p className="text-sm max-w-xs">下のボタンから最初の相談を始めることができます。</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
             <button
                onClick={onNewChat}
                className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-200"
              >
                新しい相談を始める
              </button>
          </div>
        </aside>

        {/* Right Panel: Analysis */}
        <main className="w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">総合分析レポート</h2>
            <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || conversations.length < 2}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                <AnalyticsIcon />
                {isAnalyzing ? '分析中...' : '総合分析を実行'}
            </button>
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto">
              {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-semibold">AIが過去の相談内容を分析しています...</p>
                      <p className="text-sm text-slate-500">全体の傾向をまとめています。しばらくお待ちください。</p>
                  </div>
              ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-red-500 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg">分析エラー</h3>
                      <p className="mt-1">{error}</p>
                  </div>
              ) : analysisData ? (
                  <AnalysisDisplay data={analysisData} />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <AnalyticsIcon className="w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="font-semibold text-lg">全体の傾向を分析します</h3>
                      <p className="mt-1">相談履歴が2件以上になると、<br />全体の傾向や共通の課題を分析できます。</p>
                  </div>
              )}
          </div>
        </main>
      </div>

      {selectedConversation && (
        <ConversationDetailModal 
            conversation={selectedConversation}
            onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  );
};

export default AnalysisDashboard;