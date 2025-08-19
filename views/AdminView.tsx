

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoredConversation, StoredData, STORAGE_VERSION, AnalysisData, IndividualAnalysisData } from '../types';
import { analyzeConversations, generateSummaryFromText, analyzeIndividualConversations } from '../services/geminiService';
import { setPassword } from '../services/authService';
import ConversationDetailModal from '../components/ConversationDetailModal';
import AnalysisDisplay from '../components/AnalysisDisplay';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import ExportIcon from '../components/icons/ExportIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import KeyIcon from '../components/icons/KeyIcon';

interface GroupedConversations {
    [userId: string]: StoredConversation[];
}

const AdminView: React.FC = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [individualAnalysisData, setIndividualAnalysisData] = useState<IndividualAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingIndividual, setIsAnalyzingIndividual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
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
        return;
    }

    let loadedConversations: StoredConversation[] = [];
    let needsResave = false;

    try {
        const parsedData = JSON.parse(storedDataRaw);
        let dataToProcess: any[] | null = null;

        // Case 1: New versioned format
        if (parsedData && typeof parsedData === 'object' && 'version' in parsedData && Array.isArray(parsedData.data)) {
            const storedData = parsedData as StoredData;
            if (storedData.version !== STORAGE_VERSION) {
                console.warn(`Storage version mismatch. Found ${storedData.version}, expected ${STORAGE_VERSION}.`);
            }
            dataToProcess = storedData.data;
        // Case 2: Old array format
        } else if (Array.isArray(parsedData)) {
            console.log("Old data format detected in AdminView. Migrating to versioned format.");
            dataToProcess = parsedData;
            needsResave = true;
        // Case 3: Invalid format
        } else {
            throw new Error("ローカルストレージのデータが認識できない形式です。");
        }
        
        const migrateData = (data: any[]): StoredConversation[] => {
            return data
                .filter(item => item && typeof item.id === 'number' && item.messages && item.summary)
                .map(conv => {
                    let migratedConv = { ...conv };
                    if (!conv.userId) {
                        needsResave = true;
                        migratedConv.userId = `user_unknown_${conv.id}`;
                    }
                    if (!conv.aiType) {
                        needsResave = true;
                        migratedConv.aiType = 'dog'; // Default to dog for old data
                    }
                    if (!conv.aiAvatar) {
                        needsResave = true;
                        migratedConv.aiAvatar = migratedConv.aiType === 'human' ? 'human_female_1' : 'dog_shiba_1';
                    }
                    return migratedConv;
                });
        };

        loadedConversations = migrateData(dataToProcess);

        if (needsResave) {
            console.log("Resaving conversation data in AdminView to ensure format consistency.");
            const dataToStore: StoredData = {
                version: STORAGE_VERSION,
                data: loadedConversations,
            };
            localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
        }

        setConversations(loadedConversations);

    } catch (error) {
        const err = error as Error;
        console.error("Failed to parse or process localStorage data in AdminView. It may be corrupted.", err);
        setError(`履歴データの読み込みに失敗しました。データが破損している可能性があります: ${err.message}`);
    }
  }, []);

  const groupedConversations = useMemo<GroupedConversations>(() => {
    return conversations.reduce((acc, conv) => {
        const userId = conv.userId || `user_unknown_${conv.id}`;
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(conv);
        return acc;
    }, {} as GroupedConversations);
  }, [conversations]);

  Object.values(groupedConversations).forEach(group => {
      group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

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
      console.error("Failed to generate analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(`分析中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleRunIndividualAnalysis = async (userId: string) => {
      const userConvs = groupedConversations[userId];
      if (!userConvs || userConvs.length === 0) {
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
          console.error("Failed to generate individual analysis:", err);
          const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
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
  
  const updateConversations = (newConversations: StoredConversation[]) => {
      setConversations(newConversations);
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: newConversations,
      };
      localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
      setAnalysisData(null);
      setIndividualAnalysisData(null);
      setAnalyzedUserId(null);
      setError(null);
  }

  const handleDeleteConversation = (id: number) => {
    if (window.confirm("この相談履歴を本当に削除しますか？この操作は取り消せません。")) {
        const updatedConversations = conversations.filter(c => c.id !== id);
        updateConversations(updatedConversations);
    }
  };

  const handleDeleteAllConversations = () => {
    if (window.confirm("【警告】すべての相談履歴を本当に削除しますか？この操作は取り消せません。")) {
        updateConversations([]);
        localStorage.removeItem('careerConsultations');
    }
  };

  const handleExport = () => {
      if (conversations.length === 0) {
          alert("エクスポートするデータがありません。");
          return;
      }
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: conversations,
      };
      const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `career_consultations_export_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setAnalysisData(null);
      setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
          const content = e.target?.result as string;
          if (content) {
              await processImportedFile(content);
          }
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
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
          const existingIds = new Set(conversations.map(c => c.id));
          let newConversations: StoredConversation[] = [];
          let skippedCount = 0;

          try {
              const parsedData = JSON.parse(content);
              let potentialConversations: StoredConversation[] = [];

              if (parsedData && parsedData.version && Array.isArray(parsedData.data)) {
                  potentialConversations = parsedData.data;
              } else if (Array.isArray(parsedData)) {
                  potentialConversations = parsedData;
              } else {
                  throw new Error("Invalid JSON format.");
              }
              
              const validConversations = potentialConversations.filter(item => 
                  item && typeof item.id === 'number' && item.summary && Array.isArray(item.messages)
              );
              
              validConversations.forEach(conv => {
                  if (!existingIds.has(conv.id)) {
                      // Ensure imported conversations have all required fields
                      const importedConv: StoredConversation = { 
                          ...conv, 
                          userId: conv.userId || `user_imported_${conv.id}`,
                          aiType: conv.aiType || 'dog',
                          aiAvatar: conv.aiAvatar || (conv.aiType === 'human' ? 'human_female_1' : 'dog_shiba_1'),
                      };
                      newConversations.push(importedConv);
                  } else {
                      skippedCount++;
                  }
              });

              if (newConversations.length > 0) {
                  const updated = [...conversations, ...newConversations].sort((a,b) => a.id - b.id);
                  updateConversations(updated);
              }
              alert(`${newConversations.length}件のデータをインポートしました。\n${skippedCount}件はIDが重複していたためスキップしました。`);

          } catch (jsonError) {
              console.log("Not a valid JSON file. Attempting to analyze as text.", jsonError);
              const summary = await generateSummaryFromText(content);
              const newId = Date.now();
              const newConv: StoredConversation = {
                  id: newId,
                  userId: `user_imported_${newId}`,
                  aiName: 'インポート',
                  aiType: 'human',
                  aiAvatar: 'human_female_1',
                  date: new Date().toISOString(),
                  summary: summary,
                  messages: [],
              };
              
              const updated = [...conversations, newConv].sort((a,b) => a.id - b.id);
              updateConversations(updated);
              alert(`テキストファイルをAIで解析し、1件の相談履歴としてインポートしました。`);
          }
      } catch (error) {
          console.error("Failed to process imported file:", error);
          alert(`インポート処理中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
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

  const toggleUserGroup = (userId: string) => {
    setExpandedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        return newSet;
    });
  };

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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.txt,.md"
        style={{ display: 'none' }}
        disabled={isImporting}
      />
      <div className="w-full max-w-7xl mx-auto h-full flex gap-6 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden my-6">
        {/* Left Panel: History */}
        <aside className="w-1/3 flex flex-col border-r border-slate-200 pr-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">相談者ごとの履歴 ({Object.keys(groupedConversations).length}名)</h2>
          <div className="flex-1 overflow-y-auto -mr-6 pr-6 space-y-2">
            {Object.keys(groupedConversations).length > 0 ? (
                Object.entries(groupedConversations).map(([userId, userConvs]) => (
                  <div key={userId} className="rounded-lg bg-slate-50 overflow-hidden border border-slate-200">
                    <button
                        onClick={() => toggleUserGroup(userId)}
                        className="w-full flex justify-between items-center text-left p-3 hover:bg-slate-100 transition-colors duration-150"
                        aria-expanded={expandedUsers.has(userId)}
                    >
                        <div className="flex-1 overflow-hidden pr-2">
                            <p className="font-semibold text-slate-800 text-sm truncate" title={userId}>
                                {userId.startsWith('user_unknown_') ? '不明な相談者' : '相談者ID'}
                            </p>
                            <p className="text-xs text-slate-500 truncate" title={userId}>
                                {userId.startsWith('user_unknown_') ? `ID: ...${userId.slice(-6)}` : userId}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{userConvs.length}件</span>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${expandedUsers.has(userId) ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    {expandedUsers.has(userId) && (
                        <div className="p-2 border-t border-slate-200 bg-white space-y-1">
                          {userConvs.map(conv => (
                              <div key={conv.id} className="group relative w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors duration-150 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500">
                                  <div onClick={() => setSelectedConversation(conv)} className="cursor-pointer pr-8">
                                      <p className="font-semibold text-slate-700 text-sm">{formatDate(conv.date)}</p>
                                      <p className="text-xs text-slate-500">担当AI: {conv.aiName} ({conv.aiType === 'human' ? '人間' : '犬'})</p>
                                  </div>
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                                      aria-label={`相談履歴 ${conv.id} を削除`}
                                      className="absolute top-1/2 -translate-y-1/2 right-1 p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
                                  >
                                      <TrashIcon className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          <div className="pt-2">
                            <button
                                onClick={() => handleRunIndividualAnalysis(userId)}
                                disabled={isAnalyzingAnything}
                                className="w-full text-sm text-center px-3 py-1.5 bg-sky-100 text-sky-700 font-semibold rounded-md hover:bg-sky-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                この相談者を分析
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 rounded-lg bg-slate-50">
                  <p>保存された相談履歴はありません。</p>
                  <p className="text-sm mt-1">ユーザーが相談を完了するとここに表示されます。</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 px-1">データ管理</h3>
              <div className="flex gap-2">
                  <button
                      onClick={handleImportClick}
                      disabled={isAnalyzingAnything}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                      {isImporting ? "処理中..." : <><ImportIcon />インポート</>}
                  </button>
                  <button
                      onClick={handleExport}
                      disabled={isAnalyzingAnything || conversations.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                      <ExportIcon />
                      エクスポート
                  </button>
              </div>
              {conversations.length > 0 && (
                  <button
                      onClick={handleDeleteAllConversations}
                      disabled={isAnalyzingAnything}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                      <TrashIcon />
                      全履歴を削除
                  </button>
              )}
               <div className="pt-3 mt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-600 px-1 mb-2 flex items-center gap-2"><KeyIcon />セキュリティ設定</h3>
                <form onSubmit={handleChangePassword} className="space-y-2">
                    <input
                        type="password"
                        placeholder="現在のパスワード"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-100 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="新しいパスワード (4文字以上)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-100 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        required
                        minLength={4}
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors"
                    >
                        パスワードを変更
                    </button>
                    {passwordMessage && (
                        <p className={`text-xs mt-1 px-1 ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                </form>
            </div>
          </div>
        </aside>

        {/* Right Panel: Analysis */}
        <main className="w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-lg font-bold text-slate-800">
                    {analyzedUserId ? '個別分析レポート' : '総合分析レポート'}
                </h2>
                {analyzedUserId && <p className="text-sm text-slate-500 truncate" title={analyzedUserId}>相談者ID: {analyzedUserId}</p>}
            </div>
            {analyzedUserId ? (
                <button
                    onClick={handleBackToComprehensive}
                    disabled={isAnalyzingAnything}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    総合分析に戻る
                </button>
            ) : (
                <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzingAnything || conversations.length < 2}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <AnalyticsIcon />
                    {isAnalyzing ? '分析中...' : '総合分析を実行'}
                </button>
            )}
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto">
              {(isAnalyzing || isAnalyzingIndividual || isImporting) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-semibold">
                        {isImporting ? 'インポートデータを処理中です...' : isAnalyzingIndividual ? 'AIが個別分析を生成しています...' : 'AIが総合分析を生成しています...'}
                      </p>
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

      {selectedConversation && (
        <ConversationDetailModal 
            conversation={selectedConversation}
            onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  );
};

export default AdminView;
