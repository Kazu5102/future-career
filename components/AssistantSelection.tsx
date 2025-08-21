import React, { useState, useEffect } from 'react';
import { ALL_ASSISTANTS, Assistant } from '../lib/assistants';

interface AssistantSelectionProps {
  onSelect: (assistant: Assistant) => void;
}

const AssistantSelection: React.FC<AssistantSelectionProps> = ({ onSelect }) => {
  const [selectedAssistants, setSelectedAssistants] = useState<Assistant[]>([]);

  useEffect(() => {
    const humans = ALL_ASSISTANTS.filter(a => a.type === 'human');
    const dogs = ALL_ASSISTANTS.filter(a => a.type === 'dog');

    const randomHuman = humans[Math.floor(Math.random() * humans.length)];
    const randomDog = dogs[Math.floor(Math.random() * dogs.length)];
    
    // Randomize the display order
    setSelectedAssistants([randomHuman, randomDog].sort(() => Math.random() - 0.5));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          AI Career Coach
        </h1>
        <p className="mt-4 text-xl text-gray-300">
          誰に相談しますか？
        </p>
        <p className="mt-1 text-md text-gray-400">
          AIアシスタントを選択して、キャリア相談を始めましょう。
        </p>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {selectedAssistants.map(assistant => (
          <div key={assistant.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 hover:border-purple-500">
            <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden border-4 border-gray-600 mb-4">
              <assistant.avatar className="w-full h-full object-cover p-2" />
            </div>
            <h2 className="text-2xl font-bold text-white">{assistant.name}</h2>
            <p className="text-gray-400 mt-2 text-sm">{assistant.type === 'human' ? 'プロフェッショナルな人間風' : '親しみやすい犬風'}</p>
            <button
              onClick={() => onSelect(assistant)}
              className="mt-6 px-8 py-3 font-bold text-white bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity duration-300"
            >
              このアシスタントに相談
            </button>
          </div>
        ))}
      </div>
       <footer className="text-center mt-12 text-gray-500">
          <p>&copy; {new Date().getFullYear()} - Geminiによって生成されました</p>
        </footer>
    </div>
  );
};

export default AssistantSelection;
