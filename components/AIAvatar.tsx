
import React from 'react';
import { AIAssistant } from '../types';

interface AvatarProps {
  className?: string;
  name?: string;
  isLoading?: boolean;
}

// 親しみやすい女性のAIコンサルタント
export const HumanFemaleAvatar: React.FC<AvatarProps> = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <linearGradient id="grad_female_bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF0F5" />
                <stop offset="100%" stopColor="#FFE4E1" />
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad_female_bg)" />
        
        {/* Hair Back */}
        <path d="M 60 60 C 40 80 40 160 50 180 L 150 180 C 160 160 160 80 140 60 C 120 30 80 30 60 60" fill="#6D4C41" />

        {/* Neck - Shortened visual length */}
        <rect x="88" y="130" width="24" height="40" fill="#FFCCBC" />

        {/* Body - Raised shoulders further to shorten neck (Chin is at 150) */}
        <path d="M 50 200 C 50 140 150 140 150 200" fill="#FF8A80" />
        <path d="M 75 200 L 85 140 L 115 140 L 125 200" fill="#FFFFFF" opacity="0.3" />

        {/* Face */}
        <path d="M 65 100 C 65 150 135 150 135 100 C 135 60 65 60 65 100" fill="#FFCCBC" />
        
        {/* Bangs */}
        <path d="M 65 70 C 65 90 80 90 100 80 C 120 90 135 90 135 70 C 135 40 65 40 65 70" fill="#6D4C41" />

        {/* Eyes */}
        <path d="M 80 105 Q 85 100 90 105" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 110 105 Q 115 100 120 105" stroke="#4E342E" strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Blush */}
        <ellipse cx="75" cy="115" rx="5" ry="3" fill="#FF8A80" opacity="0.4" />
        <ellipse cx="125" cy="115" rx="5" ry="3" fill="#FF8A80" opacity="0.4" />

        {/* Mouth */}
        <path d="M 92 120 Q 100 125 108 120" stroke="#D84315" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);

// 親しみやすい男性のAIコンサルタント
export const HumanMaleAvatar: React.FC<AvatarProps> = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
             <linearGradient id="grad_male_bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E3F2FD" />
                <stop offset="100%" stopColor="#BBDEFB" />
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad_male_bg)" />
        
        {/* Neck - Shortened visual length */}
        <rect x="85" y="120" width="30" height="40" fill="#FFE0B2" />

        {/* Body - Raised shoulders further to shorten neck (Chin is at 140) */}
        <path d="M 40 200 C 40 135 160 135 160 200" fill="#1976D2" />
        <path d="M 90 200 L 90 145 L 110 145 L 110 200" fill="#FFFFFF" />
        <path d="M 100 200 L 95 145 L 105 145 Z" fill="#0D47A1" />

        {/* Face */}
        <path d="M 70 90 C 70 140 130 140 130 90 C 130 50 70 50 70 90" fill="#FFE0B2" />
        
        {/* Hair */}
        <path d="M 65 80 C 65 40 135 40 135 80 C 135 95 130 85 125 75 C 100 60 80 60 65 80" fill="#3E2723" />

        {/* Eyes */}
        <circle cx="90" cy="95" r="3" fill="#3E2723" />
        <circle cx="110" cy="95" r="3" fill="#3E2723" />
        
        {/* Eyebrows */}
        <path d="M 85 88 L 95 88" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
        <path d="M 105 88 L 115 88" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />

        {/* Mouth */}
        <path d="M 95 110 Q 100 115 105 110" stroke="#3E2723" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);


// 虎徹アバター (黒黄色の服・ふわふわ版)
export const KotetsuAvatar: React.FC<AvatarProps> = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <linearGradient id="grad_kotetsu_bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF3E0" />
                <stop offset="100%" stopColor="#FFE0B2" />
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad_kotetsu_bg)"/>

        {/* Outfit: Black with Yellow Stripes */}
        <path d="M 50 200 C 50 150 150 150 150 200" fill="#212121" />
        {/* Yellow stripes on outfit */}
        <path d="M 65 200 L 70 155" stroke="#FFD700" strokeWidth="3" />
        <path d="M 135 200 L 130 155" stroke="#FFD700" strokeWidth="3" />
        <path d="M 70 180 L 130 180" stroke="#FFD700" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"/>

        {/* Head: White Fluffy Dog */}
        <g transform="translate(100, 100)">
            {/* Fur Base (Fluffy edges) */}
            <path d="M -55 0 C -60 -20 -40 -50 0 -55 C 40 -50 60 -20 55 0 C 58 20 50 45 30 55 C 10 60 -10 60 -30 55 C -50 45 -58 20 -55 0" fill="#FFFFFF" />
            
            {/* Extra fluff details */}
            <circle cx="-45" cy="10" r="10" fill="#FFFFFF" />
            <circle cx="45" cy="10" r="10" fill="#FFFFFF" />
            <circle cx="0" cy="-45" r="15" fill="#FFFFFF" />

            {/* Ears (Folded/Floppy) */}
            <path d="M -45 -35 C -60 -20 -55 0 -45 10" stroke="#E0E0E0" strokeWidth="2" fill="#F5F5F5"/>
            <path d="M 45 -35 C 60 -20 55 0 45 10" stroke="#E0E0E0" strokeWidth="2" fill="#F5F5F5"/>

            {/* Face Features */}
            {/* Eyes - Large dark */}
            <ellipse cx="-20" cy="-5" rx="8" ry="9" fill="#263238" />
            <ellipse cx="20" cy="-5" rx="8" ry="9" fill="#263238" />
            {/* Highlights */}
            <circle cx="-24" cy="-9" r="3" fill="white" />
            <circle cx="16" cy="-9" r="3" fill="white" />

            {/* Nose */}
            <path d="M -10 15 Q 0 10 10 15 Q 0 28 -10 15" fill="#212121" />
            <circle cx="-3" cy="14" r="2" fill="#616161" opacity="0.5" />

            {/* Muzzle area */}
            <path d="M 0 23 L 0 32" stroke="#9E9E9E" strokeWidth="1.5" />
            <path d="M -12 30 Q 0 40 12 30" stroke="#9E9E9E" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Cheeks */}
            <ellipse cx="-35" cy="20" rx="8" ry="5" fill="#FFCCBC" opacity="0.5" />
            <ellipse cx="35" cy="20" rx="8" ry="5" fill="#FFCCBC" opacity="0.5" />
        </g>
    </svg>
);


// わんこアバター (既存のまま)
export const DogAvatar: React.FC<AvatarProps> = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <radialGradient id="grad_dog_fur_refined" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="80%" stopColor="#f5f5f4"/>
                <stop offset="100%" stopColor="#e7e5e4"/>
            </radialGradient>
            <radialGradient id="grad_dog_ear_refined" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d1d5db"/>
                <stop offset="100%" stopColor="#9ca3af"/>
            </radialGradient>
        </defs>
        <rect width="200" height="200" fill="#f3f4f6"/>
        {/* Head */}
        <circle cx="100" cy="100" r="60" fill="url(#grad_dog_fur_refined)"/>
        {/* Ears */}
        <path d="M 50,80 C 20,30 80,30 80,80 Q 80,100 65,110 Z" fill="url(#grad_dog_ear_refined)"/>
        <path d="M 150,80 C 180,30 120,30 120,80 Q 120,100 135,110 Z" fill="url(#grad_dog_ear_refined)"/>
        {/* Face */}
        <circle cx="85" cy="90" r="8" fill="#27272a"/>
        <circle cx="115" cy="90" r="8" fill="#27272a"/>
        <circle cx="87" cy="88" r="2" fill="white" />
        <circle cx="117" cy="88" r="2" fill="white" />
        {/* Nose */}
        <path d="M 100,110 C 90,125 110,125 100,110 Z" fill="#27272a"/>
        {/* Mouth */}
        <path d="M 90 130 Q 100 140 110 130" stroke="#27272a" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
);

export const ASSISTANTS: AIAssistant[] = [
  // Human Avatars
  { 
    id: 'human_female_1',
    type: 'human', 
    title: "AIコンサルタント (女性風)",
    nameOptions: ['佐藤 さくら', '高橋 あかり', '鈴木 陽菜'],
    description: "知的で落ち着いた雰囲気で、あなたの悩みを深く理解します。",
    avatarComponent: React.createElement(HumanFemaleAvatar)
  },
  { 
    id: 'human_male_1',
    type: 'human', 
    title: "AIコンサルタント (男性風)",
    nameOptions: ['伊藤 健太', '渡辺 拓也', '田中 誠'],
    description: "親しみやすい雰囲気で、あなたの考えを丁寧に整理します。",
    avatarComponent: React.createElement(HumanMaleAvatar)
  },
  { 
    id: 'human_female_2',
    type: 'human', 
    title: "AIコンサルタント (女性風・快活)",
    nameOptions: ['加藤 美咲', '吉田 理恵', '山田 優子'],
    description: "明るい笑顔で、あなたの新しい挑戦を応援します。",
    avatarComponent: React.createElement(HumanFemaleAvatar)
  },
  { 
    id: 'human_male_2',
    type: 'human', 
    title: "AIコンサルタント (男性風・スマート)",
    nameOptions: ['中村 翔太', '小林 大輔', '斎藤 蓮'],
    description: "スマートな対話で、あなたのキャリアの可能性を引き出します。",
    avatarComponent: React.createElement(HumanMaleAvatar)
  },
  // Dog Avatars
  {
    id: 'dog_shiba_1',
    type: 'dog',
    title: "キャリア相談わんこ (柴犬風)",
    nameOptions: ['ポチ', 'ハチ', 'コタロウ'],
    description: "元気いっぱい！ポジティブな対話であなたを励まします。",
    avatarComponent: React.createElement(DogAvatar)
  },
  {
    id: 'dog_poodle_1',
    type: 'dog',
    title: "キャリア相談わんこ (プードル風)",
    nameOptions: ['ココ', 'モモ', 'マロン'],
    description: "優しく寄り添い、あなたのペースで話を聞きます。",
    avatarComponent: React.createElement(DogAvatar)
  },
  {
    id: 'dog_corgi_1',
    type: 'dog',
    title: "キャリア相談わんこ (コーギー風)",
    nameOptions: ['チャチャ', 'レオ', 'ソラ'],
    description: "短い足で一生懸命！あなたの悩みに全力で向き合います。",
    avatarComponent: React.createElement(DogAvatar)
  },
  {
    id: 'dog_retriever_1',
    type: 'dog',
    title: "キャリア相談わんこ (レトリバー風)",
    nameOptions: ['マックス', 'ラッキー', 'リク'],
    description: "賢く穏やかに。あなたのどんな話も優しく受け止めます。",
    avatarComponent: React.createElement(DogAvatar)
  },
  // --- RARE CHARACTER VARIANTS ---
  {
    id: 'dog_kotetsu',
    type: 'dog',
    title: "キャリア相談わんこ (虎徹)",
    nameOptions: ['虎徹'],
    description: "ごく稀に現れる実写のチワプーのわんこ。黒と黄色の服がおしゃれ！",
    avatarComponent: React.createElement(KotetsuAvatar)
  },
];


interface AIAvatarProps {
    avatarKey: string;
    aiName: string;
    isLoading: boolean;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ avatarKey, aiName, isLoading }) => {
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    // Fallback logic: 
    // If key is found, use it.
    // If key looks like kotetsu but not found (e.g. old ID 'dog_kotetsu_rare'), use 'dog_kotetsu'.
    let avatarComponent;
    
    if (assistant) {
        avatarComponent = assistant.avatarComponent;
    } else if (avatarKey.includes('kotetsu')) {
         avatarComponent = <KotetsuAvatar />;
    } else {
         avatarComponent = <HumanFemaleAvatar />;
    }

    return (
        <div className="bg-slate-800 rounded-2xl h-full flex flex-col items-center justify-center p-6 text-center shadow-lg">
            <div className={`w-48 h-48 rounded-full overflow-hidden border-4 border-slate-600 transition-all duration-300 ${isLoading ? 'ring-4 ring-sky-500 animate-pulse' : 'ring-2 ring-slate-500'}`}>
                {avatarComponent}
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">{aiName}</h2>
            <p className="text-slate-400 mt-2">{isLoading ? '考え中です...' : 'お話しください'}</p>
        </div>
    );
};

export default AIAvatar;
