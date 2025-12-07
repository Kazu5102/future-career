import { StoredConversation, MessageAuthor } from '../types';

export const sampleConversations: StoredConversation[] = [
  {
    id: 1700000000001,
    userId: 'user_webdev_123',
    aiName: 'ココ',
    aiType: 'dog',
    aiAvatar: 'dog_shiba_1',
    date: new Date('2024-07-28T10:30:00Z').toISOString(),
    messages: [
      { author: MessageAuthor.AI, text: 'こんにちは、ワン！ボクはキャリア相談が得意なアシスタント犬のココです。' },
      { author: MessageAuthor.USER, text: 'よろしくお願いします。現在IT企業でWebエンジニアをしています。3年目です。' },
      { author: MessageAuthor.AI, text: 'Webエンジニア3年目、すごいワン！今のお仕事で、特に楽しいのはどんな時？' },
      { author: MessageAuthor.USER, text: '新しい技術を学んで、それをプロダクトに活かせた時にやりがいを感じます。最近だとReactの新しい機能を使ってUIを改善できたのが嬉しかったです。' },
      { author: MessageAuthor.AI, text: '新しいことを覚えるのが得意なんだね！えらいワン！じゃあ逆に、何か「うーん」って悩んじゃうことはある？' },
      { author: MessageAuthor.USER, text: '今後のキャリアパスについて悩んでいます。このまま技術を極めるスペシャリストになるか、マネジメントの道に進むか、まだ決めかねていて…。' },
      { author: MessageAuthor.AI, text: 'そっかそっか、大事な悩みだワン。将来は、どんな自分になっていたい？' },
      { author: MessageAuthor.USER, text: '将来的には、チーム全体で大きな成果を出せるような存在になりたいです。でも、自分が人をまとめるタイプなのか自信がなくて。' },
      { author: MessageAuthor.AI, text: 'チームで大きなことを！かっこいい目標だワン！ここまでたくさんお話ししてくれて、ありがとうワン！この内容を基に、次はプロのキャリアコンサルタントの人間さんが、もっと具体的なアドバイスをくれるよ。興味があったら教えてね！キミのキャリアがキラキラ輝くように、ボク、心から応援してるワン！'},
    ],
    status: 'completed',
    summary: `
## クライアントの現状
- **職種**: Webエンジニア (経験3年)
- **業界**: IT
## 満足点・やりがい
- 新しい技術を学び、プロダクト開発に活かすことに喜びを感じている。
## 課題・悩み
- 将来のキャリアパスについて不確実性を感じている。
## 将来の希望
- チーム全体で大きな成果を出すことに貢献できる人材になりたいと考えている。
## 強み・スキル
- 高い技術学習意欲と実践力。
`,
  },
  {
    id: 1700000000002,
    userId: 'user_sales_456',
    aiName: '伊藤 健太',
    aiType: 'human',
    aiAvatar: 'human_male_1',
    date: new Date('2024-07-29T14:00:00Z').toISOString(),
    messages: [
      { author: MessageAuthor.AI, text: 'こんにちは。AIキャリアコンサルタントの伊藤です。本日はどうぞよろしくお願いいたします。' },
      { author: MessageAuthor.USER, text: 'こんにちは。メーカーで営業を5年やっています。' },
    ],
    status: 'completed',
    summary: `
## クライアントの現状
- **職種**: 営業職 (経験5年)
- **業界**: メーカー
`,
  }
];