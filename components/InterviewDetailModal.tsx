import React from 'react';
import { marked } from 'marked';
import { InterviewSession, InterviewMessageAuthor } from '../types';
import UserIcon from './icons/UserIcon';
import RobotIcon from './icons/RobotIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import EditIcon from './icons/EditIcon';


const InterviewDetailModal: React.FC<{ interview: InterviewSession; onClose: () => void; }> = ({ interview, onClose }) => {

  const createMarkup = (markdownText: string | undefined) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', { dateStyle: 'long', timeStyle: 'short' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">模擬面接の詳細</h2>
            <p className="text-sm text-slate-500">{formatDate(interview.date)} (職種: {interview.jobTitle})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
          {interview.feedback ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-slate-800 mb-4">総合評価</h3>
                <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(interview.feedback.overallSummary)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700 mb-4"><TrendingUpIcon />強み (Strength)</h3>
                  <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(interview.feedback.strengthAnalysis)} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-amber-700 mb-4"><EditIcon />改善点 (Improvement)</h3>
                  <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(interview.feedback.improvementAnalysis)} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-slate-800 mb-4">質疑応答の詳細分析</h3>
                <div className="space-y-4">
                  {interview.feedback.questionFeedback.map((qf, index) => (
                    <details key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200" open={index === 0}>
                      <summary className="font-bold text-slate-700 cursor-pointer hover:text-sky-600">{qf.question}</summary>
                      <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-4">
                        <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(qf.suggestion)} />
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-slate-100 rounded-lg">
                <h3 className="font-semibold text-slate-700">フィードバックはありません</h3>
                <p className="text-sm text-slate-500 mt-1">この面接セッションではフィードバックが生成されませんでした。</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">面接の記録 (トランスクリプト)</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-white rounded-lg border">
              {interview.transcript.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.author === InterviewMessageAuthor.CANDIDATE ? 'justify-end' : 'justify-start'}`}>
                  {msg.author === InterviewMessageAuthor.INTERVIEWER && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center mt-1"><RobotIcon /></div>}
                  <div className={`max-w-xl px-4 py-2 rounded-xl prose prose-sm ${msg.author === InterviewMessageAuthor.CANDIDATE ? 'bg-sky-600 text-white prose-invert' : 'bg-slate-200 text-slate-800'}`}>
                    <div dangerouslySetInnerHTML={createMarkup(msg.text)} />
                  </div>
                  {msg.author === InterviewMessageAuthor.CANDIDATE && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center mt-1"><UserIcon /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="p-4 bg-slate-100 border-t text-right">
           <button onClick={onClose} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700">閉じる</button>
        </footer>
      </div>
    </div>
  );
};

export default InterviewDetailModal;