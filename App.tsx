import React, { useState } from 'react';
import AssistantSelection from './components/AssistantSelection';
import ChatInterface from './components/ChatInterface';
import type { Assistant } from './lib/assistants';

type AppState = 'selection' | 'chat';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('selection');
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  const handleAssistantSelect = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setAppState('chat');
  };
  
  const handleExitChat = () => {
    setSelectedAssistant(null);
    setAppState('selection');
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {appState === 'selection' && <AssistantSelection onSelect={handleAssistantSelect} />}
      {appState === 'chat' && selectedAssistant && <ChatInterface assistant={selectedAssistant} onExit={handleExitChat} />}
    </div>
  );
};

export default App;
