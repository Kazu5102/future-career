
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, StoredData, STORAGE_VERSION, AIType } from '../types';
import { getStreamingChatResponse, generateSummary, reviseSummary } from '../services/geminiService';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import AIAvatar from '../components/AIAvatar';
import AvatarSelectionView from './AvatarSelectionView';
import UserDashboard from '../components/UserDashboard';

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

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting';

const UserView: React.FC = () => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userId] = useState<string>(getUserId());
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);

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
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            let allConversations: StoredConversation[] = [];

            // Handle new versioned format
            if (parsed && parsed.data && Array.isArray(parsed.data)) {
                allConversations = parsed.data;
            } 
            // Handle old array format for backward compatibility
            else if (Array.isArray(parsed)) {
                allConversations = parsed;
            }
            
            if (allConversations.length > 0) {
                 convs = allConversations.filter(c => c.userId === userId);
            }
        } catch(e) {
            console.error("Failed to parse conversations from localStorage in UserView", e);
        }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);


  const handleNewChat = useCallback(() => {
    setView('avatarSelection');
  }, []);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    setIsLoading(true);
    setAiType(type);
    setAiAvatarKey(avatarKey);

    const names = nameMap[avatarKey as keyof typeof nameMap] || nameMap.dog_shiba_1;
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    let initialMessage = '';
    if (type === 'human') {
        initialMessage = `こんにちは。AIキャリアコンサルタントの${randomName}です。本日はどのようなご相談でしょうか？あなたのキャリアについて、じっくりお話を伺わせてください。`;
    } else { // dog
        initialMessage = `こんにちは、ワン！ ボクはキャリア相談が得意なアシスタント犬の${randomName}です。あなたのキャリアについて、一緒にお話ししよう！まず、あなたのことを少し教えてくれる？`;
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

    try {
      const stream = await getStreamingChatResponse(currentMessages, aiType, aiName);
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
      const errorMessage: ChatMessage = {
        author: MessageAuthor.AI,
        text: "申し訳ありません、エラーが発生しました。もう一度お試しください。"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
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
        let currentAllConversations: StoredConversation[] = [];
        if (storedDataRaw) {
            const parsed = JSON.parse(storedDataRaw);
            if (parsed.data && Array.isArray(parsed.data)) {
                currentAllConversations = parsed.data;
            } else if (Array.isArray(parsed)) {
                currentAllConversations = parsed; // handle old format
            }
        }

        const updatedAllConversations = [...currentAllConversations, newConversation];
        const dataToStore: StoredData = {
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

  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
  }

  const renderContent = () => {
    switch(view) {
      case 'loading':
          return <div className="text-slate-500">読み込み中...</div>;
      case 'dashboard':
          return <UserDashboard conversations={userConversations} onNewChat={handleNewChat} />;
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
          showBackButton={userConversations.length > 0}
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
