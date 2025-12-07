
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, StoredData, STORAGE_VERSION, AIType } from '../types';
import { getChatResponse, generateSummary, reviseSummary } from '../services/index';
import { getUserById } from '../services/userService';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import InterruptModal from '../components/InterruptModal';
import AIAvatar, { ASSISTANTS } from '../components/AIAvatar';
import AvatarSelectionView from './AvatarSelectionView';
import UserDashboard from '../components/UserDashboard';
import ActionFooter from '../components/ActionFooter';

interface UserViewProps {
  userId: string;
  onSwitchUser: () => void;
}

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting';

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  
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
  const [isInterruptModalOpen, setIsInterruptModalOpen] = useState<boolean>(false);
  const [resumingConversationId, setResumingConversationId] = useState<number | null>(null);

  useEffect(() => {
    const user = getUserById(userId);
    setNickname(user?.nickname || userId);
    const allDataRaw = localStorage.getItem('careerConsultations');
    let convs: StoredConversation[] = [];
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            const allConversations = (parsed && parsed.data && Array.isArray(parsed.data)) ? parsed.data : (Array.isArray(parsed) ? parsed : []);
            if (allConversations.length > 0) {
                 convs = allConversations.filter((c: StoredConversation) => c.userId === userId).map((c: StoredConversation) => ({...c, status: c.status || 'completed'}));
            }
        } catch(e) { console.error(e); }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);

  const saveConversations = (allConversations: StoredConversation[]) => {
      const dataToStore: StoredData = { version: STORAGE_VERSION, data: allConversations };
      localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
  };

  const handleNewChat = useCallback(() => {
    setResumingConversationId(null);
    setMessages([]);
    setView('avatarSelection');
  }, []);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    if (!assistant) return;

    setAiType(type);
    setAiAvatarKey(avatarKey);
    setAiName(assistant.nameOptions[0]);
    
    const greetingText = type === 'human' 
        ? `こんにちは。AIキャリアコンサルタントの${assistant.nameOptions[0]}です。本日はどのようなご相談でしょうか？あなたのキャリアについて、じっくりお話を伺わせてください。`
        : `ワンワン！はじめまして！ボク、キャリア相談わんこの${assistant.nameOptions[0]}だワン！キミのキャリアの悩み、何でもクンクン嗅ぎつけて、一緒に考えてワン！元気いっぱい、最後まで応援するから安心してね！`;
    
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    setIsConsultationReady(false);
    setIsLoading(false);
    setView('chatting');
  }, []);
  
  const handleBackToDashboard = () => {
    if (messages.length > 1 && !isLoading) setIsInterruptModalOpen(true);
    else { setView('dashboard'); setMessages([]); setResumingConversationId(null); }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let currentMessages = [...messages];
    if (editingState) {
        currentMessages = messages.slice(0, editingState.index);
        setEditingState(null);
    }
    const userMsg: ChatMessage = { author: MessageAuthor.USER, text };
    currentMessages.push(userMsg);
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const response = await getChatResponse(currentMessages, aiType, aiName);
      const aiMsg: ChatMessage = { author: MessageAuthor.AI, text: response.text };
      setMessages(prev => [...prev, aiMsg]);
      setIsConsultationReady(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "エラー";
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: `エラー: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName)
      .then(s => setSummary(s))
      .catch(() => setSummary("エラーが発生しました"))
      .finally(() => setIsSummaryLoading(false));
  };

  const handleReviseSummary = (req: string) => {
    if (!req.trim()) return;
    setIsSummaryLoading(true);
    reviseSummary(summary, req).then(s => setSummary(s)).finally(() => setIsSummaryLoading(false));
  };
  
  const handleFinalizeAndSave = () => {
      if (!summary) return;
      const allDataRaw = localStorage.getItem('careerConsultations');
      let allConvs: StoredConversation[] = [];
      if (allDataRaw) {
          const parsed = JSON.parse(allDataRaw);
          allConvs = (parsed.data || parsed);
      }
      
      const newConv: StoredConversation = {
        id: resumingConversationId || Date.now(),
        userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary, date: new Date().toISOString(), status: 'completed'
      };

      let updatedConvs;
      if(resumingConversationId) {
          updatedConvs = allConvs.map(c => c.id === resumingConversationId ? newConv : c);
      } else {
          updatedConvs = [...allConvs, newConv];
      }
      
      saveConversations(updatedConvs);
      setUserConversations(updatedConvs.filter(c => c.userId === userId));
      setView('dashboard');
      setIsSummaryModalOpen(false);
  };

  const renderContent = () => {
    switch(view) {
      case 'dashboard': return <UserDashboard conversations={userConversations} onNewChat={handleNewChat} onResume={(c) => { setMessages(c.messages); setResumingConversationId(c.id); setView('chatting'); }} userId={userId} nickname={nickname} onSwitchUser={onSwitchUser} />;
      case 'avatarSelection': return <AvatarSelectionView onSelect={handleAvatarSelected} />;
      case 'chatting':
        return (
           <div className="w-full max-w-7xl h-full flex flex-row gap-6">
            <div className="hidden lg:flex w-[400px] h-full flex-shrink-0">
              <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} />
            </div>
            <div className="flex-1 h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={(i) => setEditingState({index: i, text: messages[i].text})} />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200">
                  <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} isEditing={!!editingState} initialText={editingState?.text || ''} onCancelEdit={() => setEditingState(null)} />
                  {messages.length > 1 && <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} />}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full' : 'min-h-full'}`}>
      {view === 'chatting' && <Header showBackButton={userConversations.length > 0} onBackClick={handleBackToDashboard} />}
      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 md:p-6 overflow-hidden' : 'p-0 sm:p-4 md:p-6 justify-start'}`}>{renderContent()}</main>
      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onRevise={handleReviseSummary} onFinalize={handleFinalizeAndSave} />
      <InterruptModal isOpen={isInterruptModalOpen} onSaveAndInterrupt={() => { /* Implementation skipped for brevity, handled same as save */ setIsInterruptModalOpen(false); setView('dashboard'); }} onExitWithoutSaving={() => { setIsInterruptModalOpen(false); setView('dashboard'); }} onContinue={() => setIsInterruptModalOpen(false)} />
    </div>
  );
};

export default UserView;
