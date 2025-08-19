import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { InterviewMessage, InterviewMessageAuthor, InterviewFeedback, InterviewSession } from '../types';
import { getStreamingInterviewResponse, generateInterviewFeedback } from '../services/geminiService';
import SendIcon from '../components/icons/SendIcon';
import UserIcon from '../components/icons/UserIcon';
import RobotIcon from '../components/icons/RobotIcon';
import LightbulbIcon from '../components/icons/LightbulbIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import EditIcon from '../components/icons/EditIcon';

type InterviewStage = 'setup' | 'in_progress' | 'generating_feedback' | 'feedback_ready';

interface InterviewViewProps {
    userId: string;
    onFinish: (session?: InterviewSession) => void;
}

const createMarkup = (markdownText: string | undefined) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const InterviewView: React.FC<InterviewViewProps> = ({ userId, onFinish }) => {
    const [stage, setStage] = useState<InterviewStage>('setup');
    const [jobTitle, setJobTitle] = useState('');
    const [companyContext, setCompanyContext] = useState('');
    
    const [transcript, setTranscript] = useState<InterviewMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentInput, setCurrentInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleStartInterview = async () => {
        if (!jobTitle.trim()) {
            alert('職種名を入力してください。');
            return;
        }
        setIsLoading(true);
        setStage('in_progress');
        await callInterviewAI([]);
    };

    const callInterviewAI = async (currentTranscript: InterviewMessage[]) => {
        setIsLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const stream = await getStreamingInterviewResponse(currentTranscript, jobTitle, companyContext, controller.signal);
            if (!stream) throw new Error("ストリームの取得に失敗しました。");

            let aiResponse = '';
            setTranscript(prev => [...prev, { author: InterviewMessageAuthor.INTERVIEWER, text: '' }]);

            const reader = stream.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                aiResponse += decoder.decode(value, { stream: true });
                setTranscript(prev => {
                    const newTranscript = [...prev];
                    newTranscript[newTranscript.length - 1] = { ...newTranscript[newTranscript.length - 1], text: aiResponse };
                    return newTranscript;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : '不明なエラー';
            setError(`AIとの通信中にエラーが発生しました: ${errorMessage}`);
            setTranscript(prev => [...prev, { author: InterviewMessageAuthor.INTERVIEWER, text: `申し訳ありません、通信エラーが発生しました。再度お試しください。` }]);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInput.trim() || isLoading) return;

        const newTranscript = [...transcript, { author: InterviewMessageAuthor.CANDIDATE, text: currentInput }];
        setTranscript(newTranscript);
        setCurrentInput('');

        // A simple keyword check to trigger feedback generation
        if (currentInput.includes('終了') || currentInput.includes('フィードバック')) {
             handleEndInterview(newTranscript);
        } else {
            await callInterviewAI(newTranscript);
        }
    };

    const handleEndInterview = async (finalTranscript: InterviewMessage[]) => {
        setStage('generating_feedback');
        setIsLoading(true);
        try {
            const generatedFeedback = await generateInterviewFeedback(finalTranscript, jobTitle, companyContext);
            setFeedback(generatedFeedback);
            setStage('feedback_ready');
        } catch (err) {
            console.error(err);
            setError('フィードバックの生成に失敗しました。');
            setStage('in_progress'); // Go back to interview to allow retry
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAndExit = () => {
        const newSession: InterviewSession = {
            id: Date.now(),
            userId,
            jobTitle,
            companyContext,
            date: new Date().toISOString(),
            transcript,
            feedback,
        };
        onFinish(newSession);
    };

    const renderSetup = () => (
        <div className="w-full max-w-lg mx-auto">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">模擬面接セットアップ</h1>
                <p className="mt-2 text-slate-600">AI面接官とのシミュレーションを開始します。</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 space-y-6">
                <div>
                    <label htmlFor="job-title" className="block text-sm font-bold text-slate-700 mb-2">面接を受ける職種</label>
                    <input
                        id="job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="例：ソフトウェアエンジニア, プロジェクトマネージャー"
                        className="w-full px-4 py-3 bg-slate-100 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="company-context" className="block text-sm font-bold text-slate-700 mb-2">企業や業界の概要 (任意)</label>
                    <textarea
                        id="company-context"
                        value={companyContext}
                        onChange={(e) => setCompanyContext(e.target.value)}
                        rows={3}
                        placeholder="例：急成長中のフィンテックスタートアップ, 大手メーカーの新規事業部門"
                        className="w-full p-3 bg-slate-100 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                <button
                    onClick={handleStartInterview}
                    disabled={!jobTitle.trim() || isLoading}
                    className="w-full px-6 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-slate-400"
                >
                    {isLoading ? '準備中...' : '面接を開始する'}
                </button>
            </div>
        </div>
    );
    
    const renderInProgress = () => (
        <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
             {/* Header */}
            <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">模擬面接: <span className="text-indigo-600">{jobTitle}</span></h2>
                <button 
                    onClick={() => handleEndInterview(transcript)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
                >
                    面接を終了して評価を受ける
                </button>
            </header>
            
            {/* Chat Window */}
            <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                {transcript.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.author === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                        {msg.author === 'interviewer' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center"><RobotIcon /></div>}
                        <div className={`max-w-lg lg:max-w-2xl px-5 py-3 rounded-2xl prose ${msg.author === 'candidate' ? 'bg-sky-600 text-white prose-invert' : 'bg-slate-200 text-slate-800'}`}>
                           {msg.text ? <div dangerouslySetInnerHTML={createMarkup(msg.text)} /> : <div className="animate-pulse">...</div>}
                        </div>
                        {msg.author === 'candidate' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center"><UserIcon /></div>}
                    </div>
                ))}
                {error && <p className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">{error}</p>}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder={isLoading ? 'AIが応答中です...' : '回答を入力...'}
                        disabled={isLoading}
                        className="flex-1 w-full px-4 py-3 bg-slate-100 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        autoFocus
                    />
                    <button type="submit" disabled={isLoading || !currentInput.trim()} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center transition-colors hover:bg-emerald-600 disabled:bg-slate-400">
                        <SendIcon />
                    </button>
                </div>
            </form>
        </div>
    );
    
    const renderFeedback = () => (
        <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">模擬面接フィードバックレポート</h2>
                <div>
                     <button onClick={() => onFinish()} className="px-4 py-2 text-sm text-slate-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors mr-2">
                        終了する
                    </button>
                    <button onClick={handleSaveAndExit} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                        保存して終了
                    </button>
                </div>
            </header>
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
                {stage === 'generating_feedback' ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-600">
                         <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="font-semibold">AIが面接内容を分析し、フィードバックを生成しています...</p>
                         <p className="text-sm text-slate-500">これには1分ほどかかる場合があります。</p>
                     </div>
                ) : feedback ? (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-md">
                             <h3 className="text-lg font-bold text-slate-800 mb-4">総合評価</h3>
                             <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(feedback.overallSummary)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700 mb-4"><TrendingUpIcon />強み (Strength)</h3>
                                <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(feedback.strengthAnalysis)} />
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-amber-700 mb-4"><EditIcon />改善点 (Improvement)</h3>
                                <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(feedback.improvementAnalysis)} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md">
                             <h3 className="text-lg font-bold text-slate-800 mb-4">質疑応答の詳細分析</h3>
                             <div className="space-y-4">
                                {feedback.questionFeedback.map((qf, index) => (
                                    <details key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200" open={index === 0}>
                                        <summary className="font-bold text-slate-700 cursor-pointer hover:text-sky-600">{qf.question}</summary>
                                        <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-600">あなたの回答</h4>
                                                <p className="text-sm text-slate-800 mt-1 italic p-2 bg-slate-100 rounded">"{qf.answer}"</p>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold text-sm text-slate-600">分析</h4>
                                                <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(qf.analysis)} />
                                            </div>
                                             <div>
                                                <h4 className="font-semibold text-sm text-slate-600">改善案</h4>
                                                <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={createMarkup(qf.suggestion)} />
                                            </div>
                                        </div>
                                    </details>
                                ))}
                             </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-slate-500">フィードバックを読み込めませんでした。</p>
                )}
            </div>
        </div>
    );


    switch (stage) {
        case 'setup':
            return renderSetup();
        case 'in_progress':
            return renderInProgress();
        case 'generating_feedback':
        case 'feedback_ready':
            return renderFeedback();
        default:
            return null;
    }
};

export default InterviewView;
