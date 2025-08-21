import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Assistant } from '../lib/assistants';
import { LoadingSpinner, SendIcon, MicrophoneIcon, EditIcon } from './Icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface ChatInterfaceProps {
  assistant: Assistant;
  onExit: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ assistant, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);
  
  useEffect(() => {
    const generateIntroduction = async () => {
      setIsLoading(true);
      setError('');
      
      const introMessageId = 'intro-message';
      setMessages([{ id: introMessageId, role: 'model', text: '' }]);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'まずはあなたのキャラクターで自己紹介をしてください。' }] }],
          config: { systemInstruction: assistant.systemInstruction },
        });

        let accumulatedText = '';
        for await (const chunk of responseStream) {
          accumulatedText += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            const introMessage = newMessages.find(m => m.id === introMessageId);
            if (introMessage) {
              introMessage.text = accumulatedText;
            }
            return newMessages;
          });
        }
      } catch (err) {
        console.error(err);
        setError('自己紹介の生成中にエラーが発生しました。');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateIntroduction();
  }, [assistant]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input.trim() };
    let currentMessages = [...messages];
    
    if (editingMessageId) {
      const editIndex = messages.findIndex(m => m.id === editingMessageId);
      if (editIndex !== -1) {
        currentMessages = messages.slice(0, editIndex);
      }
      setEditingMessageId(null);
    }
    
    setMessages([...currentMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    const historyForApi = [...currentMessages, userMessage].map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: historyForApi,
            config: { systemInstruction: assistant.systemInstruction },
        });
        
        const modelMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);
        
        let accumulatedText = '';
        for await (const chunk of responseStream) {
            accumulatedText += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.id === modelMessageId) {
                    lastMessage.text = accumulatedText;
                }
                return newMessages;
            });
        }
    } catch (err) {
        console.error(err);
        setError('メッセージの送信中にエラーが発生しました。');
        setMessages(prev => prev.slice(0, -1));
    } finally {
        setIsLoading(false);
    }
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setInput(message.text);
  };
  
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-purple-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
        <header className="flex items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 mr-4">
                <assistant.avatar className="w-full h-full object-cover p-1" />
            </div>
            <div>
                <h1 className="text-xl font-bold">{assistant.name}</h1>
                <p className="text-sm text-gray-400">AI Career Coach</p>
            </div>
            <button onClick={onExit} className="ml-auto px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                選び直す
            </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                         <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0">
                            <assistant.avatar className="w-full h-full object-cover p-1" />
                        </div>
                    )}
                    <div className={`max-w-xl p-3 md:p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                        {msg.role === 'model' && msg.text === '' ? (
                           <LoadingSpinner className="w-6 h-6" />
                        ) : (
                           <p className="whitespace-pre-wrap leading-relaxed break-words">
                               {msg.role === 'model' ? renderFormattedText(msg.text) : msg.text}
                           </p>
                        )}
                    </div>
                     {msg.role === 'user' && msg.id === lastUserMessage?.id && !isLoading && (
                        <button onClick={() => handleEdit(msg)} className="p-2 text-gray-400 hover:text-white transition flex-shrink-0">
                            <EditIcon className="w-5 h-5" />
                        </button>
                     )}
                </div>
            ))}
            {isLoading && messages[messages.length-1]?.role === 'user' && (
                 <div className="flex items-end gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0">
                        <assistant.avatar className="w-full h-full object-cover p-1" />
                    </div>
                     <div className="max-w-xl p-4 rounded-2xl bg-gray-700 rounded-bl-none">
                        <LoadingSpinner className="w-6 h-6" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </main>
        
        {error && <div className="p-4 text-center bg-red-900/50 text-red-300 flex-shrink-0">{error}</div>}

        <footer className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 resize-none max-h-40"
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                        }
                    }}
                />
                 {hasRecognitionSupport && (
                    <button type="button" onClick={isListening ? stopListening : startListening} className={`p-3 rounded-full transition flex-shrink-0 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                 )}
                <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition flex-shrink-0">
                    <SendIcon className="w-6 h-6" />
                </button>
            </form>
        </footer>
    </div>
  );
};

export default ChatInterface;