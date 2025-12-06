import React from 'react';
import { AIAssistant } from '../types';
import { 
  HumanFemaleAvatar,
  HumanMaleAvatar,
  DogAvatar,
  KotetsuAvatar
} from '../components/AIAvatar';

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
  {
    id: 'dog_kotetsu',
    type: 'dog',
    title: "キャリア相談わんこ (虎徹)",
    nameOptions: ['虎徹'],
    description: "ごく稀に現れるクマの着ぐるみを着たわんこ。黒と黄色の服がおしゃれ！",
    avatarComponent: React.createElement(KotetsuAvatar)
  },
];