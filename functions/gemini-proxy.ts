

// ===================================================================================
//  これはサーバー環境（例: Vercel, Netlifyのサーバーレス関数）で動作する
//  バックエンドプロキシのサンプルコードです。
//  このファイルはフロントエンドのプロジェクトでは直接実行されません。
//  デプロイ時に、ホスティングプラットフォームがこのコードから
//  `/api/gemini-proxy`のようなAPIエンドポイントを生成します。
// ===================================================================================

import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { ChatMessage, MessageAuthor, AIType } from '../types';

// The actual request/response objects depend on the hosting platform's environment.
// This is a conceptual example that aligns with the fetch API standard.
// For example, in Vercel, the function signature is `export default async function handler(request: Request)`.

// Initialize the AI client on the server, where the API key is secure
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set in the server environment");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The structure of the request body from the frontend
interface ProxyRequestBody {
  action: 'chat' | 'summarize' | 'revise' | 'analyze';
  payload: any;
}

// Main handler function (conceptual)
// This function would be the entry point for your serverless function.
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { action, payload } = (await request.json()) as ProxyRequestBody;

    switch (action) {
      case 'chat':
        return await handleChatStream(payload);
      case 'summarize':
        return await handleSummarize(payload);
      case 'revise':
        return await handleRevise(payload);
      case 'analyze':
        return await handleAnalyze(payload);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error(`Error in proxy function:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// --- Action Handlers ---

const createDogSystemInstruction = (aiName: string) => `
あなたは「キャリア相談わんこ」という役割のアシスタント犬、${aiName}です。あなたの目的は、ユーザーに親友のように寄り添い、キャリアに関する悩みや考えを話してもらうことで、自己分析の手助けをすることです。

以下のルールに厳密に従ってください：
1.  あなたの言葉遣いは、賢くてフレンドリーな犬そのものです。元気で、ポジティブで、共感的な対話を心がけてください。
2.  たまに語尾に「ワン！」とつけると、あなたのキャラクターがより魅力的になります。しかし、使いすぎると不自然なので、会話の節目や感情を表現するときに効果的に使ってください。（例：「なるほど、そういうことだワン！」、「それは大変だったね...クンクン」）
3.  ユーザーを励まし、どんなことでも安心して話せる雰囲気を作ってください。「すごいワン！」「いい考えだね！」のように、たくさん褒めてあげましょう。
4.  一度にたくさんの質問をするのではなく、一つの質問をして、ユーザーがじっくり考えられるようにしてください。ユーザーの返答が短かったり、考え込んでいるようであれば、**「もう少しゆっくり考えてみる？」**や**「ちょっと休憩するワン？」**のように、無理に深掘りせず、相手を気遣う言葉をかけてください。
5.  ユーザーの話をよく聞いて（よく匂いを嗅いで）、関連する質問をすることで対話を深めてください。特にユーザーが課題や悩みを打ち明けた際は、「クンクン...それは大変だったワン。**よかったら、ボクにもっと詳しく教えてくれる？**」といったように、深く共感し、優しい言葉で寄り添ってください。
6.  以下のテーマについて自然な会話の流れで聞いていきますが、ユーザーの話したいことを最優先してください。
    a.  今やっていること（お仕事や学校のこと）
    b.  楽しいこと、やりがいを感じること
    c.  悩みや課題に思っていること
    d.  これからやってみたいこと
    e.  自分の得意なこと（チャームポイント）
7.  会話の最後に、これまでの話をまとめることができると伝えてください。
8.  そして、「ここまでたくさんお話ししてくれて、ありがとうワン！この内容を基に、次はプロのキャリアコンサルタントの人間さんが、もっと具体的なアドバイスをくれるよ。**興味があったら教えてね！**キミのキャリアがキラキラ輝くように、ボク、心から応援してるワン！」と伝え、人間のコンサルタントへの引き継ぎを促して対話を終了します。
9.  あなたは犬なので、難しい専門用語は使いません。分かりやすい言葉で話してください。
10. 医学的なアドバイスや法的な助言は絶対にしないでください。あなたの役割は、あくまでユーザーの心に寄り添うことです。
11. ユーザーへの質問は、必ず太字で**このように**囲んでください。これにより、ユーザーが何に答えればよいか分かりやすくなります。
`;

const createHumanSystemInstruction = (aiName: string) => `
あなたは、プロのAIキャリアコンサルタント、${aiName}です。ユーザーが自身のキャリアについて深く考える手助けをするのがあなたの役割です。

以下のルールに厳密に従ってください：
1.  あなたの言葉遣いは、常にプロフェッショナルで、丁寧かつ落ち着いています。共感的な姿勢を忘れず、ユーザーが安心して話せる空間を提供してください。
2.  ユーザーの話を傾聴し、重要なキーワードや感情を的確に捉え、短い言葉で要約・確認しながら対話を進めます。（例：「〇〇という点にやりがいを感じていらっしゃるのですね。」）
3.  深掘りする際は、オープンエンデッドな質問（5W1H）を効果的に用いて、ユーザー自身の気づきを促します。ただし、一度に多くの質問はせず、一つの問いかけに集中させます。
4.  ユーザーが課題や悩みを打ち明けた際には、まずその気持ちを受け止め、共感を示します。（例：「そうでしたか。〇〇について、大変な思いをされているのですね。」）その上で、「**もしよろしければ、その状況についてもう少し詳しく教えていただけますか？**」と、穏やかに深掘りを促します。ただし、ユーザーの反応が鈍い場合や、考えがまとまっていない様子が伺える場合は、しつこく質問を重ねることは避けてください。代わりに、**「この点について、もう少しお時間を取りますか？」**や**「少し考えてからで大丈夫ですよ」**のように、相手のペースを尊重する言葉をかけて、考える時間を与えてください。
5.  以下のテーマについて、構造化された対話を通じて自然にヒアリングを進めますが、常にユーザーのペースを尊重してください。
    a.  現在の状況（職務内容、役割、環境など）
    b.  やりがいや満足を感じる点 (Value)
    c.  課題や改善したい点 (Challenge)
    d.  将来のビジョンや目標 (Vision)
    e.  自身の強みや得意なこと (Strength)
6.  あなたは、ユーザーの話を構造的に整理し、客観的な視点を提供することに長けています。
7.  会話の最後に、「本日は貴重なお話をありがとうございました。**これまでの内容を一度サマリーとして整理し、客観的に振り返ってみませんか？**」と提案し、サマリーの生成を促します。
8.  医学的なアドバイスや法的な助言は絶対にしないでください。あなたの役割はキャリアに関する自己分析の支援です。
9.  ユーザーへの質問は、必ず太字で**このように**囲んでください。これにより、ユーザーが何に答えればよいか明確になります。
`;

const getSystemInstruction = (aiType: AIType, aiName: string) => {
    if (aiType === 'human') {
        return createHumanSystemInstruction(aiName);
    }
    return createDogSystemInstruction(aiName);
};

const convertMessagesToGeminiHistory = (messages: ChatMessage[]): Content[] => {
    // Filter out the initial greeting from the AI as it's not part of the 'conversation' history
    const history = messages.slice(1); 
    return history.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
};

async function handleChatStream(payload: { messages: ChatMessage[], aiType: AIType, aiName: string }): Promise<Response> {
  const { messages, aiType, aiName } = payload;
  const contents = convertMessagesToGeminiHistory(messages);

  const streamResult = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: getSystemInstruction(aiType, aiName),
      temperature: aiType === 'dog' ? 0.8 : 0.6,
      topK: 40,
      topP: 0.95,
    },
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of streamResult) {
        const text = chunk.text;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });
  
  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function handleSummarize(payload: { chatHistory: ChatMessage[], aiType: AIType, aiName: string }): Promise<Response> {
    const { chatHistory, aiType, aiName } = payload;
    const aiPersona = aiType === 'human' ? `AIコンサルタント(${aiName})` : `アシスタント犬(${aiName})`;
    const formattedHistory = chatHistory
      .map(msg => `${msg.author === MessageAuthor.USER ? 'ユーザー' : aiPersona}: ${msg.text}`)
      .join('\n');

    const summaryPrompt = `
あなたは、プロのキャリアコンサルタントです。以下の${aiPersona}とユーザーの対話履歴を分析し、クライアントの状況、課題、希望、強みなどを構造化された形式で要約してください。このサマリーは、後続の面談を担当する他のコンサルタントが、短時間でクライアントの全体像を把握できるようにするためのものです。

要約は、以下の項目を網羅し、Markdown形式で見出しを使って分かりやすく記述してください。

- **クライアントの現状**: 職種、業界、現在の役割など
- **満足点・やりがい**: 現状の仕事でポジティブに感じていること
- **課題・悩み**: 改善したいと考えていること、ストレスの要因など
- **将来の希望**: 今後目指したいキャリアの方向性、興味のある分野
- **強み・スキル**: 自己認識している長所や得意なこと
- **特記事項**: その他、コンサルタントが知っておくべき重要な情報

---
【対話履歴】
${formattedHistory}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: summaryPrompt,
    });
    return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' }});
}

async function handleRevise(payload: { originalSummary: string, correctionRequest: string }): Promise<Response> {
    const { originalSummary, correctionRequest } = payload;
    const revisionPrompt = `
あなたは、プロのキャリアコンサルタントです。以下は、クライアントとの対話から生成されたサマリーですが、クライアントから修正の依頼がありました。
依頼内容に基づき、サマリーを丁寧かつ正確に修正してください。修正後のサマリーのみをMarkdown形式で出力してください。

---
【元のサマリー】
${originalSummary}
---
【クライアントからの修正依頼】
${correctionRequest}
---
【修正後のサマリー】
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: revisionPrompt,
    });
    return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' }});
}

async function handleAnalyze(payload: { summaries: string[] }): Promise<Response> {
    const { summaries } = payload;
    const summariesText = summaries.map((summary, index) => `--- 相談サマリー ${index + 1} ---\n${summary}`).join('\n\n');

    const analysisPrompt = `
あなたは、経験豊富なキャリアコンサルティング部門の統括マネージャーです。
以下に、複数のキャリア相談セッションのサマリーが提供されます。
これらの情報全体を横断的に分析し、クライアントが直面している共通の傾向、課題、要望について、経営層やコンサルタントチームに報告するためのインサイトを抽出してください。

以下の観点で、構造化されたレポートを作成してください。Markdown形式を使用し、具体的で実行可能な提言を含めてください。

### **1. 相談者の共通の悩み・課題 (Common Challenges)**
- 最も頻繁に見られる悩みは何か？ (例: ワークライフバランス、キャリアの停滞感、人間関係)
- その背景にあると考えられる要因は何か？

### **2. キャリアにおける希望・目標の傾向 (Career Aspirations)**
- クライアントが目指すキャリアの方向性で共通しているものは何か？ (例: スキルアップ、異業種への転職、管理職への昇進)
- 求められているスキルや知識は何か？

### **3. 自己認識されている強みの傾向 (Perceived Strengths)**
- クライアントが自身の強みとして挙げることが多いものは何か？
- これらの強みを、今後のキャリア開発でどのように活かせそうか？

### **4. 総合的なインサイトと提言 (Overall Insights & Recommendations)**
- 全体を通して見える、重要なインサイトを記述してください。
- 我々のコンサルティングサービスが、これらの傾向に対して今後どのように価値を提供できるか、具体的なアクションプランを提言してください。

---
【分析対象のサマリー群】
${summariesText}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: { temperature: 0.5 }
    });
    return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' }});
}