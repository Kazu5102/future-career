import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, StoredData, STORAGE_VERSION, AIType, InterviewSession } from '../types';
import { getStreamingChatResponse, generateSummary, reviseSummary } from '../services/geminiService';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import AIAvatar from '../components/AIAvatar';
import AvatarSelectionView from './AvatarSelectionView';
import UserDashboard from '../components/UserDashboard';
import InterviewView from './InterviewView';

const nameMap = {
  human_female_1: ['佐藤 さくら', '高橋 あかり', '鈴木 陽菜'],
  human_male_1: ['伊藤 健太', '渡辺 拓也', '田中 誠'],
  human_female_2: ['加藤 美咲', '吉田 理恵', '山田 優子'],
  human_male_2: ['中村 翔太', '小林 大輔', '斎藤 蓮'],
  dog_shiba_1: ['ポチ', 'ハチ', 'コタロウ'],
  dog_poodle_1: ['ココ', 'モモ', 'マロン'],
  dog_corgi_1: ['チャチャ', 'レオ', 'ソラ'],
  dog_retriever_1: ['マックス', 'ラッキー', 'リク'],
};

const getUserId = (): string => {
    let userId = localStorage.getItem('careerConsultingUserId');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('careerConsultingUserId', userId);
    }
    return userId;
};

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting' | 'interview';

const UserView: React.FC = () => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userId] = useState<string>(getUserId());
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [userInterviews, setUserInterviews] = useState<InterviewSession[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [editingState, setEditingState] = useState<{ index: number; text: string } | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    const allDataRaw = localStorage.getItem('careerConsultations');
    let convs: StoredConversation[] = [];
    let intervs: InterviewSession[] = [];
    
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            let allData: StoredData = { version: STORAGE_VERSION, data: [], interviews: [] };

            // Handle new versioned format
            if (parsed && parsed.version && parsed.data) {
                allData = parsed as StoredData;
            } 
            // Handle old array format for backward compatibility
            else if (Array.isArray(parsed)) {
                allData = { version: 1, data: parsed, interviews: [] };
            }
            
            if (allData.data && Array.isArray(allData.data)) {
                 convs = allData.data.filter(c => c.userId === userId);
            }
            if (allData.interviews && Array.isArray(allData.interviews)) {
                 intervs = allData.interviews.filter(i => i.userId === userId);
            }
        } catch(e) {
            console.error("Failed to parse data from localStorage in UserView", e);
        }
    }
    setUserConversations(convs);
    setUserInterviews(intervs);
    setView(convs.length > 0 || intervs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);


  const handleNewChat = useCallback(() => {
    setView('avatarSelection');
  }, []);
  
  const handleNewInterview = useCallback(() => {
    setView('interview');
  }, []);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    setIsLoading(true);
    
    const { type, avatarKey } = selection;
    setAiType(type);
    setAiAvatarKey(avatarKey);

    const names = nameMap[avatarKey as keyof typeof nameMap] || nameMap.dog_shiba_1;
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    let initialMessage = '';
    if (type === 'human') {
        initialMessage = `こんにちは。AIキャリアコンサルタントの${randomName}です。本日はどのようなご相談でしょうか？あなたのキャリアについて、じっくりお話を伺わせてください。`;
    } else { // dog
        initialMessage = `こんにちは、ワン！ ボクはキャリア相談が得意なアシスタント犬の${randomName}です。あなたのキャリアについて、一緒にお話ししよう！まず、あなたのことを少し教えてもらえるかな？`;
    }
    
    setAiName(randomName);
    setMessages([{ author: MessageAuthor.AI, text: initialMessage }]);
    setIsConsultationReady(false);
    setEditingState(null);
    setIsLoading(false);
    setView('chatting');
  }, []);
  
  const handleBackToDashboard = () => {
    if (messages.length > 1) {
        if (window.confirm("ダッシュボードに戻りますか？\n現在の相談内容は保存されずに破棄されます。")) {
            setView('dashboard');
            setMessages([]);
        }
    } else {
        setView('dashboard');
        setMessages([]);
    }
  };

  const handleStartEdit = (index: number) => {
    const messageToEdit = messages[index];
    if (messageToEdit.author === MessageAuthor.USER) {
        setEditingState({ index, text: messageToEdit.text });
    }
  };

  const handleCancelEdit = () => {
      setEditingState(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let currentMessages: ChatMessage[];
    
    if (editingState) {
        const { index } = editingState;
        currentMessages = messages.slice(0, index);
        currentMessages.push({ author: MessageAuthor.USER, text });
        setEditingState(null);
    } else {
        const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
        currentMessages = [...messages, userMessage];
    }

    setMessages(currentMessages);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("Request timed out after 30 seconds. Aborting.");
      controller.abort();
    }, 30000); // 30-second timeout

    try {
      const stream = await getStreamingChatResponse(currentMessages, aiType, aiName, controller.signal);
      if (!stream) {
          throw new Error("ストリームの取得に失敗しました。");
      }
      
      let aiResponse = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          aiResponse += decoder.decode(value, { stream: true });
          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: aiResponse };
              return newMessages;
          });
      }
      
      if (aiResponse.includes("心から応援してるワン") || aiResponse.includes("サマリーとして整理し")) {
        setIsConsultationReady(true);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      let detailMessage = "サーバーとの通信に失敗しました。";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          detailMessage = "サーバーからの応答がタイムアウトしました。しばらくしてから再度お試しください。";
        } else if (error.message.includes("502") || error.message.includes("504")) {
            detailMessage = "サーバーが応答しませんでした。時間をおいて再度お試しください。(タイムアウトの可能性があります)";
        } else if (error.message.includes("400")) {
            detailMessage = "リクエストが正しくありません。";
        } else {
            detailMessage = error.message;
        }
      }

      const errorMessage: ChatMessage = {
        author: MessageAuthor.AI,
        text: `申し訳ありません、エラーが発生しました。\n\n---\n*技術的な詳細: ${detailMessage}*`
      };
      
      setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if(lastMessage && lastMessage.author === MessageAuthor.AI && lastMessage.text === '') {
              return [...prev.slice(0, -1), errorMessage];
          }
          return [...prev, errorMessage];
      });

    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    try {
      const summaryText = await generateSummary(messages, aiType, aiName);
      setSummary(summaryText);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("サマリーの生成中にエラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleReviseSummary = async (correctionRequest: string) => {
    if (!correctionRequest.trim() || !summary) return;
    setIsSummaryLoading(true);
    try {
        const revisedSummaryText = await reviseSummary(summary, correctionRequest);
        setSummary(revisedSummaryText);
    } catch (error) {
        console.error("Failed to revise summary:", error);
        alert("サマリーの修正中にエラーが発生しました。");
    } finally {
        setIsSummaryLoading(false);
    }
  };

  const handleFinalizeAndSave = () => {
    let newConversation: StoredConversation | null = null;
    if (summary && !summary.includes("エラーが発生しました")) {
      newConversation = {
        id: Date.now(),
        userId: userId,
        aiName,
        aiType,
        aiAvatar: aiAvatarKey,
        messages,
        summary: summary,
        date: new Date().toISOString(),
      };
      
      try {
        const storedDataRaw = localStorage.getItem('careerConsultations');
        let currentData: StoredData = { version: STORAGE_VERSION, data: [], interviews: [] };
        if (storedDataRaw) {
             const parsed = JSON.parse(storedDataRaw);
             if (parsed.version) {
                 currentData = parsed;
             } else if (Array.isArray(parsed)) {
                 currentData.data = parsed;
             }
        }

        const updatedAllConversations = [...currentData.data, newConversation];
        const dataToStore: StoredData = {
          ...currentData,
          version: STORAGE_VERSION,
          data: updatedAllConversations,
        };
        localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
        alert('相談内容が保存されました。');
      } catch (error) {
        console.error("Failed to save conversation:", error);
        alert("相談内容の保存に失敗しました。");
        newConversation = null; // Don't update state if save failed
      }
    }
    
    setIsSummaryModalOpen(false);
    setSummary('');
    setMessages([]);

    if(newConversation) {
        setUserConversations(prev => [...prev, newConversation!]);
    }
    setView('dashboard');
  };
  
  const handleFinishInterview = (newInterviewSession?: InterviewSession) => {
    if (newInterviewSession) {
        setUserInterviews(prev => [...prev, newInterviewSession]);
        try {
            const storedDataRaw = localStorage.getItem('careerConsultations');
            let currentData: StoredData = { version: STORAGE_VERSION, data: [], interviews: [] };
            if (storedDataRaw) {
                const parsed = JSON.parse(storedDataRaw);
                if (parsed.version) {
                    currentData = parsed;
                } else if (Array.isArray(parsed)) {
                    currentData.data = parsed;
                }
            }

            const updatedAllInterviews = [...(currentData.interviews || []), newInterviewSession];
            const dataToStore: StoredData = {
                ...currentData,
                version: STORAGE_VERSION,
                interviews: updatedAllInterviews
            };
            localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
            alert('面接履歴が保存されました。');
        } catch (error) {
            console.error("Failed to save interview:", error);
            alert("面接履歴の保存に失敗しました。");
        }
    }
    setView('dashboard');
  };

  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
  }

  const renderContent = () => {
    switch(view) {
      case 'loading':
          return <div className="text-slate-500">読み込み中...</div>;
      case 'dashboard':
          return <UserDashboard 
                    conversations={userConversations} 
                    interviews={userInterviews}
                    onNewChat={handleNewChat} 
                    onNewInterview={handleNewInterview}
                 />;
      case 'avatarSelection':
        return <AvatarSelectionView onSelect={handleAvatarSelected} />;
      case 'chatting':
        return (
           <div className="w-full max-w-7xl h-full flex flex-row gap-6">
            <div className="hidden lg:flex w-[400px] h-full flex-shrink-0">
              <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} />
            </div>
            <div className="flex-1 h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <ChatWindow 
                  messages={messages} 
                  isLoading={isLoading} 
                  onEditMessage={handleStartEdit}
              />
              <ChatInput 
                  onSubmit={handleSendMessage} 
                  isLoading={isLoading}
                  isEditing={!!editingState}
                  initialText={editingState ? editingState.text : ''}
                  onCancelEdit={handleCancelEdit}
              />
            </div>
          </div>
        );
       case 'interview':
        return <InterviewView userId={userId} onFinish={handleFinishInterview} />;
      default:
        return null;
    }
  };


  return (
    <div className="flex flex-col h-full bg-slate-100">
      {view === 'chatting' && (
        <Header 
          isConsultationReady={isConsultationReady}
          onConsultClick={handleGenerateSummary}
          showBackButton={userConversations.length > 0 || userInterviews.length > 0}
          onBackClick={handleBackToDashboard}
        />
      )}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
        {renderContent()}
      </main>
      
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={handleCloseSummaryModal}
        summary={summary}
        isLoading={isSummaryLoading}
        onRevise={handleReviseSummary}
        onFinalize={handleFinalizeAndSave}
      />
    </div>
  );
};

export default UserView;