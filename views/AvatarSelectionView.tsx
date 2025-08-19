import React, { useState, useEffect } from 'react';
import { AIType } from '../types';
import { FemaleAvatar1, MaleAvatar1, FemaleAvatar2, MaleAvatar2, ShibaAvatar, PoodleAvatar, CorgiAvatar, RetrieverAvatar } from '../components/AIAvatar';

interface AvatarSelection {
    type: AIType;
    avatarKey: string;
}

interface AvatarInfo extends AvatarSelection {
  title: string;
  description: string;
  avatar: React.ReactNode;
}

interface AvatarSelectionViewProps {
  onSelect: (selection: AvatarSelection) => void;
}

const SelectionCard: React.FC<{
  info: AvatarInfo;
  onClick: (selection: AvatarSelection) => void
}> = ({ info, onClick }) => (
  <button 
    onClick={() => onClick(info)}
    className="w-full max-w-sm flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300"
  >
    <div className="w-40 h-40 mb-4 rounded-full overflow-hidden">
      {info.avatar}
    </div>
    <h3 className="text-xl font-bold text-slate-800 text-center">{info.title}</h3>
    <p className="text-slate-600 mt-2 h-12 w-full text-sm text-left">{info.description}</p>
    <div className="mt-4 w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors">
      このアシスタントと話す
    </div>
  </button>
);

const humanAvatars: AvatarInfo[] = [
  { 
    type: 'human', 
    avatarKey: 'human_female_1',
    title: "AIコンサルタント (女性風)",
    description: "知的で落ち着いた雰囲気で、あなたの悩みを深く理解します。",
    avatar: <FemaleAvatar1 />
  },
  { 
    type: 'human', 
    avatarKey: 'human_male_1',
    title: "AIコンサルタント (男性風)",
    description: "親しみやすい雰囲気で、あなたの考えを丁寧に整理します。",
    avatar: <MaleAvatar1 />
  },
   { 
    type: 'human', 
    avatarKey: 'human_female_2',
    title: "AIコンサルタント (女性風・快活)",
    description: "明るい笑顔で、あなたの新しい挑戦を応援します。",
    avatar: <FemaleAvatar2 />
  },
  { 
    type: 'human', 
    avatarKey: 'human_male_2',
    title: "AIコンサルタント (男性風・スマート)",
    description: "スマートな対話で、あなたのキャリアの可能性を引き出します。",
    avatar: <MaleAvatar2 />
  },
];

const dogAvatars: AvatarInfo[] = [
  {
    type: 'dog',
    avatarKey: 'dog_shiba_1',
    title: "キャリア相談わんこ (柴犬風)",
    description: "元気いっぱい！ポジティブな対話であなたを励まします。",
    avatar: <ShibaAvatar />
  },
  {
    type: 'dog',
    avatarKey: 'dog_poodle_1',
    title: "キャリア相談わんこ (プードル風)",
    description: "優しく寄り添い、あなたのペースで話を聞きます。",
    avatar: <PoodleAvatar />
  },
  {
    type: 'dog',
    avatarKey: 'dog_corgi_1',
    title: "キャリア相談わんこ (コーギー風)",
    description: "短い足で一生懸命！あなたの悩みに全力で向き合います。",
    avatar: <CorgiAvatar />
  },
  {
    type: 'dog',
    avatarKey: 'dog_retriever_1',
    title: "キャリア相談わんこ (レトリバー風)",
    description: "賢く穏やかに。あなたのどんな話も優しく受け止めます。",
    avatar: <RetrieverAvatar />
  },
]


const AvatarSelectionView: React.FC<AvatarSelectionViewProps> = ({ onSelect }) => {
  const [displayAvatars, setDisplayAvatars] = useState<AvatarInfo[]>([]);
  
  useEffect(() => {
    // Select one random human avatar and one random dog avatar to display.
    const randomHuman = humanAvatars[Math.floor(Math.random() * humanAvatars.length)];
    const randomDog = dogAvatars[Math.floor(Math.random() * dogAvatars.length)];
    setDisplayAvatars([randomHuman, randomDog]);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">相談相手を選んでください</h1>
        <p className="mt-2 text-slate-600">どのアシスタントと話したいですか？</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {displayAvatars.map((avatarInfo) => (
            <SelectionCard
                key={avatarInfo.avatarKey}
                info={avatarInfo}
                onClick={onSelect}
            />
        ))}
      </div>
    </div>
  );
};

export default AvatarSelectionView;
