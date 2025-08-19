

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoredConversation, StoredData, STORAGE_VERSION, AnalysisData, IndividualAnalysisData, InterviewSession } from '../types';
import { analyzeConversations, generateSummaryFromText, analyzeIndividualConversations } from '../services/geminiService';
import { setPassword } from '../services/authService';
import ConversationDetailModal from '../components/ConversationDetailModal';
import InterviewDetailModal from '../components/InterviewDetailModal';
import AnalysisDisplay from '../components/AnalysisDisplay';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import ExportIcon from '../components/icons/ExportIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import KeyIcon from '../components/icons/KeyIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';

interface GroupedData<T> {
    [userId: string]: T[];
}

const AdminView: React.FC = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [individualAnalysisData, setIndividualAnalysisData] = useState<IndividualAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingIndividual, setIsAnalyzingIndividual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSession | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [analyzedUserId, setAnalyzedUserId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);


  useEffect(() => {
    const storedDataRaw = localStorage.getItem('careerConsultations');
    if (!storedDataRaw) {
        setConversations([]);
        setInterviews([]);
        return;
    }

    let loadedConversations: StoredConversation[] = [];
    let loadedInterviews: InterviewSession[] = [];
    let needsResave = false;

    try {
        const parsedData = JSON.parse(storedDataRaw);

        if (parsedData && parsedData.version) {
            // New format: { version, data, interviews }
            loadedConversations = parsedData.data || [];
            loadedInterviews = parsedData.interviews || [];
        } else if (Array.isArray(parsedData)) {
            // Old format: an array of conversations
            console.log("Old data format detected. Migrating.");
            loadedConversations = parsedData;
            loadedInterviews = []; // Old format has no interviews by definition
            needsResave = true; // Mark for migration to the new object format
        } else {
            throw new Error("ローカルストレージのデータが認識できない形式です。");
        }

        const migrateConversation = (conv: any) => {
            let migratedConv = { ...conv };
            let wasMigrated = false;
            if (!conv.userId) { wasMigrated = true; migratedConv.userId = `user_unknown_${conv.id}`; }
            if (!conv.aiType) { wasMigrated = true; migratedConv.aiType = 'dog'; }
            if (!conv.aiAvatar) { wasMigrated = true; migratedConv.aiAvatar = migratedConv.aiType === 'human' ? 'human_female_1' : 'dog_shiba_1'; }
            return { migratedConv, wasMigrated };
        };

        const validConversations = loadedConversations.filter(item => item && typeof item.id === 'number' && item.messages && item.summary);
        const migrationResults = validConversations.map(migrateConversation);
        const finalConversations = migrationResults.map(r => r.migratedConv);
        const anyWasMigrated = migrationResults.some(r => r.wasMigrated);

        if (needsResave || anyWasMigrated) {
            console.log("Resaving data to ensure format consistency.");
            const dataToStore: StoredData = {
                version: STORAGE_VERSION,
                data: finalConversations,
                interviews: loadedInterviews,
            };
            localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
        }

        setConversations(finalConversations);
        setInterviews(loadedInterviews);

    } catch (err) {
        console.error("Failed to parse localStorage data in AdminView.", err);
        setError(`履歴データの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  }, []);

  const allUserIds = useMemo(() => {
    const userIds = new Set<string>();
    conversations.forEach(c => userIds.add(c.userId));
    interviews.forEach(i => userIds.add(i.userId));
    return Array.from(userIds);
  }, [conversations, interviews]);

  const groupedConversations = useMemo<GroupedData<StoredConversation>>(() => {
    return conversations.reduce((acc, conv) => {
        if (!acc[conv.userId]) acc[conv.userId] = [];
        acc[conv.userId].push(conv);
        return acc;
    }, {} as GroupedData<StoredConversation>);
  }, [conversations]);

  const groupedInterviews = useMemo<GroupedData<InterviewSession>>(() => {
    return interviews.reduce((acc, interview) => {
        if (!acc[interview.userId]) acc[interview.userId] = [];
        acc[interview.userId].push(interview);
        return acc;
    }, {} as GroupedData<InterviewSession>);
  }, [interviews]);

  Object.values(groupedConversations).forEach(group => group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  Object.values(groupedInterviews).forEach(group => group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  const handleRunAnalysis = async () => {
    if (conversations.length < 2) {
      alert("分析には少なくとも2件の相談履歴が必要です。");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisData(null);
    setIndividualAnalysisData(null);
    setAnalyzedUserId(null);
    setError(null);
    try {
      const result = await analyzeConversations(conversations);
      setAnalysisData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラー";
      setError(`分析中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleRunIndividualAnalysis = async (userId: string) => {
      const userConvs = groupedConversations[userId] || [];
      if (userConvs.length === 0) {
          alert("このユーザーには分析可能な相談履歴がありません。");
          return;
      }
      setIsAnalyzingIndividual(true);
      setAnalyzedUserId(userId);
      setError(null);
      setIndividualAnalysisData(null);
      setAnalysisData(null);
      try {
          const result = await analyzeIndividualConversations(userConvs, userId);
          setIndividualAnalysisData(result);
      } catch(err) {
          const errorMessage = err instanceof Error ? err.message : "不明なエラー";
          setError(`個別分析中にエラーが発生しました: ${errorMessage}`);
      } finally {
          setIsAnalyzingIndividual(false);
      }
  };

  const handleBackToComprehensive = () => {
      setIndividualAnalysisData(null);
      setAnalyzedUserId(null);
      setError(null);
  };
  
  const updateStoredData = (newConversations: StoredConversation[], newInterviews: InterviewSession[]) => {
      setConversations(newConversations);
      setInterviews(newInterviews);
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: newConversations,
          interviews: newInterviews,
      };
      localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
      setAnalysisData(null);
      setIndividualAnalysisData(null);
      setAnalyzedUserId(null);
      setError(null);
  }

  const handleDeleteConversation = (id: number) => {
    if (window.confirm("この相談履歴を本当に削除しますか？")) {
        const updatedConversations = conversations.filter(c => c.id !== id);
        updateStoredData(updatedConversations, interviews);
    }
  };
  
  const handleDeleteInterview = (id: number) => {
    if (window.confirm("この面接履歴を本当に削除しますか？")) {
        const updatedInterviews = interviews.filter(i => i.id !== id);
        updateStoredData(conversations, updatedInterviews);
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm("【警告】すべての相談および面接履歴を本当に削除しますか？この操作は取り消せません。")) {
        updateStoredData([], []);
    }
  };

  const handleExport = () => {
      if (conversations.length === 0 && interviews.length === 0) {
          alert("エクスポートするデータがありません。");
          return;
      }
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: conversations,
          interviews: interviews,
      };
      const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career_consultations_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
          await processImportedFile(e.target?.result as string);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setIsImporting(false);
      };
      reader.onerror = () => {
          alert("ファイルの読み込みに失敗しました。");
          setIsImporting(false);
      };
      reader.readAsText(file);
  };

  const processImportedFile = async (content: string) => {
      try {
          const existingConvIds = new Set(conversations.map(c => c.id));
          const existingInterviewIds = new Set(interviews.map(i => i.id));
          let importedConversations: StoredConversation[] = [];
          let importedInterviews: InterviewSession[] = [];
          let skippedConv = 0, skippedInt = 0;

          try {
              const parsed = JSON.parse(content);
              const dataToImport: StoredData = {
                  version: parsed.version || 1,
                  data: parsed.data || (Array.isArray(parsed) ? parsed : []),
                  interviews: parsed.interviews || []
              };

              (dataToImport.data || []).forEach(conv => {
                  if (conv && conv.id && !existingConvIds.has(conv.id)) importedConversations.push(conv);
                  else skippedConv++;
              });
              (dataToImport.interviews || []).forEach(interview => {
                  if (interview && interview.id && !existingInterviewIds.has(interview.id)) importedInterviews.push(interview);
                  else skippedInt++;
              });

              if (importedConversations.length > 0 || importedInterviews.length > 0) {
                  updateStoredData([...conversations, ...importedConversations], [...interviews, ...importedInterviews]);
              }
              alert(`インポート完了:\n- 相談履歴: ${importedConversations.length}件\n- 面接履歴: ${importedInterviews.length}件\n- スキップ: ${skippedConv + skippedInt}件 (ID重複)`);

          } catch (jsonError) {
              console.log("Not a valid JSON file. Attempting to analyze as text.", jsonError);
              const summary = await generateSummaryFromText(content);
              const newId = Date.now();
              const newConv: StoredConversation = { id: newId, userId: `user_imported_${newId}`, aiName: 'インポート', aiType: 'human', aiAvatar: 'human_female_1', date: new Date().toISOString(), summary: summary, messages: [] };
              updateStoredData([...conversations, newConv], interviews);
              alert(`テキストファイルをAIで解析し、1件の相談履歴としてインポートしました。`);
          }
      } catch (error) {
          alert(`インポート処理中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
      }
  };


  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const toggleUserGroup = (userId: string) => setExpandedUsers(prev => { const newSet = new Set(prev); if (newSet.has(userId)) newSet.delete(userId); else newSet.add(userId); return newSet; });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const result = setPassword(newPassword, currentPassword);
    setPasswordMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    if (result.success) {
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordMessage(null), 4000);
    }
  };

  const isAnalyzingAnything = isAnalyzing || isAnalyzingIndividual || isImporting;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.txt,.md" style={{ display: 'none' }} disabled={isImporting} />
      <div className="w-full max-w-7xl mx-auto h-full flex gap-6 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden my-6">
        <aside className="w-1/3 flex flex-col border-r border-slate-200 pr-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">相談者ごとの履歴 ({allUserIds.length}名)</h2>
          <div className="flex-1 overflow-y-auto -mr-6 pr-6 space-y-2">
            {allUserIds.length > 0 ? (
                allUserIds.map(userId => {
                  const userConvs = groupedConversations[userId] || [];
                  const userInterviews = groupedInterviews[userId] || [];
                  return (
                  <div key={userId} className="rounded-lg bg-slate-50 overflow-hidden border border-slate-200">
                    <button onClick={() => toggleUserGroup(userId)} className="w-full flex justify-between items-center text-left p-3 hover:bg-slate-100 transition-colors" aria-expanded={expandedUsers.has(userId)}>
                        <p className="font-semibold text-slate-800 text-sm truncate" title={userId}>{userId}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{userConvs.length + userInterviews.length}件</span>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${expandedUsers.has(userId) ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    {expandedUsers.has(userId) && (
                        <div className="p-2 border-t border-slate-200 bg-white">
                          {userConvs.length > 0 && <h4 className="text-xs font-bold text-slate-500 px-3 pt-2">相談履歴</h4>}
                          {userConvs.map(conv => (
                              <div key={conv.id} className="group relative text-left p-3 rounded-lg hover:bg-slate-100">
                                  <div onClick={() => setSelectedConversation(conv)} className="cursor-pointer pr-8">
                                      <p className="font-semibold text-slate-700 text-sm">{formatDate(conv.date)}</p>
                                      <p className="text-xs text-slate-500">担当AI: {conv.aiName}</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} aria-label="削除" className="absolute top-1/2 -translate-y-1/2 right-1 p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                              </div>
                          ))}
                          {userInterviews.length > 0 && <h4 className="text-xs font-bold text-slate-500 px-3 pt-2 mt-2 border-t -mx-2 px-2">面接履歴</h4>}
                          {userInterviews.map(interview => (
                              <div key={interview.id} className="group relative text-left p-3 rounded-lg hover:bg-slate-100">
                                  <div onClick={() => setSelectedInterview(interview)} className="cursor-pointer pr-8">
                                      <p className="font-semibold text-slate-700 text-sm">{formatDate(interview.date)}</p>
                                      <p className="text-xs text-slate-500">職種: {interview.jobTitle}</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteInterview(interview.id); }} aria-label="削除" className="absolute top-1/2 -translate-y-1/2 right-1 p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                              </div>
                          ))}
                          {(userConvs.length > 0 || userInterviews.length > 0) &&
                            <div className="pt-2 mt-2 border-t -mx-2 px-2">
                              <button onClick={() => handleRunIndividualAnalysis(userId)} disabled={isAnalyzingAnything || userConvs.length === 0} className="w-full text-sm text-center px-3 py-1.5 bg-sky-100 text-sky-700 font-semibold rounded-md hover:bg-sky-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed">この相談者を分析</button>
                            </div>
                          }
                        </div>
                    )}
                  </div>
                )})
            ) : ( <p className="text-center text-slate-500 p-4">履歴はありません。</p> )}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 px-1">データ管理</h3>
              <div className="flex gap-2">
                  <button onClick={handleImportClick} disabled={isAnalyzingAnything} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400">{isImporting ? "処理中..." : <><ImportIcon />インポート</>}</button>
                  <button onClick={handleExport} disabled={isAnalyzingAnything || (conversations.length === 0 && interviews.length === 0)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400"><ExportIcon />エクスポート</button>
              </div>
              {(conversations.length > 0 || interviews.length > 0) && (
                  <button onClick={handleDeleteAllData} disabled={isAnalyzingAnything} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-slate-400"><TrashIcon />全データを削除</button>
              )}
               <div className="pt-3 mt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-600 px-1 mb-2 flex items-center gap-2"><KeyIcon />セキュリティ設定</h3>
                <form onSubmit={handleChangePassword} className="space-y-2">
                    <input type="password" placeholder="現在のパスワード" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-100 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500" required />
                    <input type="password" placeholder="新しいパスワード (4文字以上)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-100 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500" required minLength={4} />
                    <button type="submit" className="w-full px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700">パスワードを変更</button>
                    {passwordMessage && <p className={`text-xs mt-1 px-1 ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage.text}</p>}
                </form>
            </div>
          </div>
        </aside>

        <main className="w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-lg font-bold text-slate-800">{analyzedUserId ? '個別分析レポート' : '総合分析レポート'}</h2>
                {analyzedUserId && <p className="text-sm text-slate-500 truncate" title={analyzedUserId}>相談者ID: {analyzedUserId}</p>}
            </div>
            {analyzedUserId ? (
                <button onClick={handleBackToComprehensive} disabled={isAnalyzingAnything} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400">総合分析に戻る</button>
            ) : (
                <button onClick={handleRunAnalysis} disabled={isAnalyzingAnything || conversations.length < 2} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-400"><AnalyticsIcon />{isAnalyzing ? '分析中...' : '総合分析を実行'}</button>
            )}
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto">
              {(isAnalyzing || isAnalyzingIndividual || isImporting) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-semibold">{isImporting ? 'インポート処理中...' : isAnalyzingIndividual ? '個別分析中...' : '総合分析中...'}</p>
                      <p className="text-sm text-slate-500">しばらくお待ちください。</p>
                  </div>
              ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-red-500 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg">分析エラー</h3>
                      <p className="mt-1">{error}</p>
                      <button onClick={handleBackToComprehensive} className="mt-4 px-3 py-1 bg-red-100 rounded-md">レポートを閉じる</button>
                  </div>
              ) : individualAnalysisData ? (
                  <AnalysisDisplay data={individualAnalysisData} />
              ) : analysisData ? (
                  <AnalysisDisplay data={analysisData} />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <AnalyticsIcon className="w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="font-semibold text-lg">全体の傾向を分析します</h3>
                      <p className="mt-1">「総合分析を実行」ボタンを押すか、<br />左のリストから特定の相談者を選択して分析を開始してください。</p>
                  </div>
              )}
          </div>
        </main>
      </div>

      {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
      {selectedInterview && <InterviewDetailModal interview={selectedInterview} onClose={() => setSelectedInterview(null)} />}
    </>
  );
};

export default AdminView;