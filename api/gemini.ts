
// This file is intended to be deployed as a Vercel Serverless Function.
// It should be placed in the `/api` directory of your project.

import { GoogleGenAI, GenerateContentResponse, Content, Type, Chat } from "@google/genai";
import { ChatMessage, MessageAuthor, StoredConversation, AnalysisData, AIType, IndividualAnalysisData, SkillMatchingResult } from '../types';

// Initialize the AI client on the server, where the API key is secure.
// This will throw an error and cause the function to fail safely if the API key is not set in Vercel.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set in the server environment");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The structure of the request body from the frontend
interface ProxyRequestBody {
  action: 'chat' | 'summarize' | 'revise' | 'analyze' | 'analyzeIndividual' | 'summarizeText' | 'skillMatch';
  payload: any;
}

// --- Helper functions, prompts, and schemas (moved from the original geminiService.ts) ---

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

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    keyMetrics: {
      type: Type.OBJECT,
      description: "分析のキーとなる指標",
      properties: {
        totalConsultations: { type: Type.NUMBER, description: '分析対象の相談の総数' },
        commonIndustries: { type: Type.ARRAY, description: '相談者によく見られる業界トップ3を抽出する', items: { type: Type.STRING }},
      },
      required: ['totalConsultations', 'commonIndustries'],
    },
    commonChallenges: {
      type: Type.ARRAY,
      description: '相談者が抱える共通の課題を分類し、上位5項目を抽出する。各項目の割合（value）の合計が100になるように正規化する。',
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: '課題の内容 (例: キャリアパスの悩み)' },
          value: { type: Type.NUMBER, description: 'その課題を持つ相談者の割合（パーセント）' },
        },
        required: ['label', 'value'],
      },
    },
    careerAspirations: {
      type: Type.ARRAY,
      description: '相談者のキャリアに関する希望を分類し、上位5項目を抽出する。各項目の割合（value）の合計が100になるように正規化する。',
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: 'キャリアの希望の内容 (例: スキルアップ)' },
          value: { type: Type.NUMBER, description: 'その希望を持つ相談者の割合（パーセント）' },
        },
        required: ['label', 'value'],
      },
    },
    commonStrengths: {
        type: Type.ARRAY,
        description: '相談者が自己認識している共通の強みを5つ抽出する',
        items: { type: Type.STRING }
    },
    overallInsights: {
      type: Type.STRING,
      description: '以前の形式と同様の、詳細な分析と提言を含むMarkdown形式のレポート。'
    }
  },
  required: ['keyMetrics', 'commonChallenges', 'careerAspirations', 'commonStrengths', 'overallInsights'],
};

const skillMatchingSchemaForIndividualAnalysis = {
    type: Type.OBJECT,
    properties: {
        analysisSummary: { type: Type.STRING, description: "ユーザーの強み、興味、価値観を分析したMarkdown形式のサマリー。" },
        recommendedRoles: {
            type: Type.ARRAY,
            description: "ユーザーの特性にマッチすると思われる職種を3〜5個提案するリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING, description: "推奨される職種名 (例: データアナリスト)" },
                    reason: { type: Type.STRING, description: "その職種を推奨する理由についての簡潔な説明。" },
                    matchScore: { type: Type.NUMBER, description: "ユーザーとの適性度を0から100の数値で示すスコア。" }
                },
                required: ['role', 'reason', 'matchScore']
            }
        },
        skillsToDevelop: {
            type: Type.ARRAY,
            description: "推奨職種に就くために、今後伸ばすと良いスキルや知識のリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "学習を推奨するスキル名 (例: Python, SQL)" },
                    reason: { type: Type.STRING, description: "そのスキルがなぜ重要かの簡潔な説明。" }
                },
                required: ['skill', 'reason']
            }
        },
        learningResources: {
            type: Type.ARRAY,
            description: "スキル習得に役立つ具体的な学習リソース（オンラインコース、書籍、記事など）のリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "リソースのタイトル。" },
                    type: { type: Type.STRING, enum: ['course', 'book', 'article', 'video'], description: "リソースの種類。" },
                    url: { type: Type.STRING, description: "リソースへのアクセスURL。" }
                },
                required: ['title', 'type', 'url']
            }
        }
    },
    required: ['analysisSummary', 'recommendedRoles', 'skillsToDevelop', 'learningResources']
};

const individualAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        userId: { type: Type.STRING, description: "分析対象のユーザーID" },
        totalConsultations: { type: Type.NUMBER, description: "このユーザーの相談総数" },
        consultations: {
            type: Type.ARRAY,
            description: "個々の相談セッションの詳細リスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    dateTime: { type: Type.STRING, description: "相談が行われた正確な日時 (例: '2024年7月31日 11:00')" },
                    estimatedDurationMinutes: { type: Type.NUMBER, description: "サマリーの内容の濃さや長さから推測される、その相談のおおよその時間（分単位）。" },
                },
                required: ['dateTime', 'estimatedDurationMinutes'],
            }
        },
        keyThemes: { type: Type.ARRAY, description: "相談全体で繰り返し現れる主要なテーマや悩み (3-5個)", items: { type: Type.STRING } },
        detectedStrengths: { type: Type.ARRAY, description: "対話から読み取れる、ユーザーの潜在的な強みや資質 (3-5個)", items: { type: Type.STRING } },
        areasForDevelopment: { type: Type.ARRAY, description: "ユーザーが成長するために取り組むと良い可能性のある領域 (3-5個)", items: { type: Type.STRING } },
        suggestedNextSteps: { type: Type.ARRAY, description: "このユーザーに対してコンサルタントが提案できる具体的な次のアクション (3-5個)", items: { type: Type.STRING } },
        overallSummary: { type: Type.STRING, description: "ユーザーの相談の変遷、成長、現在の状況をまとめたMarkdown形式の総括レポート" },
        skillMatchingResult: skillMatchingSchemaForIndividualAnalysis,
        hiddenSkills: {
            type: Type.ARRAY,
            description: "クライアントには直接提示されなかったが、コンサルタントが知っておくべき潜在的なスキルや、長期的な視点で伸ばすべきスキルのリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "隠れたスキル名" },
                    reason: { type: Type.STRING, description: "そのスキルがなぜコンサルタントにとって重要かの簡潔な説明。" }
                },
                required: ['skill', 'reason']
            }
        }
    },
    required: ['userId', 'totalConsultations', 'consultations', 'keyThemes', 'detectedStrengths', 'areasForDevelopment', 'suggestedNextSteps', 'overallSummary', 'skillMatchingResult', 'hiddenSkills'],
};

const skillMatchingSchema = {
    type: Type.OBJECT,
    properties: {
        analysisSummary: { type: Type.STRING, description: "ユーザーの強み、興味、価値観を分析したMarkdown形式のサマリー。" },
        recommendedRoles: {
            type: Type.ARRAY,
            description: "ユーザーの特性にマッチすると思われる職種を3〜5個提案するリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING, description: "推奨される職種名 (例: データアナリスト)" },
                    reason: { type: Type.STRING, description: "その職種を推奨する理由についての簡潔な説明。" },
                    matchScore: { type: Type.NUMBER, description: "ユーザーとの適性度を0から100の数値で示すスコア。" }
                },
                required: ['role', 'reason', 'matchScore']
            }
        },
        skillsToDevelop: {
            type: Type.ARRAY,
            description: "推奨職種に就くために、今後伸ばすと良いスキルや知識のリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "学習を推奨するスキル名 (例: Python, SQL)" },
                    reason: { type: Type.STRING, description: "そのスキルがなぜ重要かの簡潔な説明。" }
                },
                required: ['skill', 'reason']
            }
        },
        learningResources: {
            type: Type.ARRAY,
            description: "スキル習得に役立つ具体的な学習リソース（オンラインコース、書籍、記事など）のリスト。",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "リソースのタイトル。" },
                    type: { type: Type.STRING, enum: ['course', 'book', 'article', 'video'], description: "リソースの種類。" },
                    url: { type: Type.STRING, description: "リソースへのアクセスURL。" }
                },
                required: ['title', 'type', 'url']
            }
        }
    },
    required: ['analysisSummary', 'recommendedRoles', 'skillsToDevelop', 'learningResources']
};

// --- Action Handlers ---

async function handleChatStream(payload: { messages: ChatMessage[], aiType: AIType, aiName: string }): Promise<Response> {
  const { messages, aiType, aiName } = payload;

  // ユーザーの最後のプロンプトを取得
  const userPrompt = messages[messages.length - 1];
  // それ以前の会話履歴を取得
  const historyMessages = messages.slice(0, messages.length - 1);
  
  if (userPrompt.author !== MessageAuthor.USER) {
      return new Response(JSON.stringify({ error: 'Bad Request: Last message must be from user.' }), { status: 400 });
  }

  // Gemini APIが要求する形式に会話履歴を変換
  const geminiHistory = historyMessages.map(msg => ({
      role: msg.author === MessageAuthor.USER ? 'user' : 'model',
      parts: [{ text: msg.text }],
  }));

  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: geminiHistory,
    config: {
      systemInstruction: getSystemInstruction(aiType, aiName),
      temperature: aiType === 'dog' ? 0.8 : 0.6,
      topK: 40,
      topP: 0.95,
    },
  });

  const streamResult = await chat.sendMessageStream({ message: userPrompt.text });

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

要約は、以下の項目を網羅し、**各項目では箇条書き（ブレットポイント）を積極的に使用して**、情報を簡潔かつ明瞭にまとめてください。

---

### 相談の要点 (3点まとめ)
- 対話全体から最も重要なポイントを3つの箇条書きで簡潔にまとめてください。

### クライアントの現状
- 職種、業界、現在の役割、経験年数などを箇条書きで記述してください。

### 満足点・やりがい
- 現状の仕事でポジティブに感じていることを具体的に箇条書きで記述してください。

### 課題・悩み
- 改善したいと考えていること、ストレスの要因などを具体的に箇条書きで記述してください。

### 将来の希望
- 今後目指したいキャリアの方向性、興味のある分野などを具体的に箇条書きで記述してください。

### 強み・スキル
- 対話から読み取れる、クライアントが自己認識している長所や得意なことを箇条書きで記述してください。

### 特記事項
- その他、コンサルタントが知っておくべき重要な情報があれば記述してください。

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
依頼内容に基づき、サマリーを丁寧かつ正確に修正してください。

修正後のサマリーも、元のサマリーと同様に以下の構造を維持してください:
### 相談の要点 (3点まとめ)
### クライアントの現状
### 満足点・やりがい
### 課題・悩み
### 将来の希望
### 強み・スキル
### 特記事項

各項目では、引き続き箇条書きを積極的に使用して、情報を簡潔にまとめてください。
修正後のサマリーのみをMarkdown形式で出力してください。

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

async function handleAnalyze(payload: { summaries: StoredConversation[] }): Promise<Response> {
    const { summaries } = payload;
    const summariesText = summaries.map((conv, index) => `--- 相談サマリー ${index + 1} (ID: ${conv.id}) ---\n${conv.summary}`).join('\n\n');
    const analysisPrompt = `
あなたは、経験豊富なキャリアコンサルティング部門の統括マネージャーです。
以下に、複数のキャリア相談セッションのサマリーが提供されます。
これらの情報全体を横断的に分析し、クライアントが直面している共通の傾向、課題、要望について、定量的データと定性的インサイトの両方を含む構造化されたレポートを作成してください。

最終的な出力は、指定されたJSONスキーマに従う必要があります。

### **分析の指示**

1.  **定量的分析**:
    *   **キーメトリクス**: 相談の総数と、最も頻繁に出現する業界トップ3を特定してください。
    *   **共通の課題**: 全てのサマリーから、相談者が抱える課題を分類・集計し、上位5項目を特定してください。各項目が全体に占める割合をパーセンテージで示してください（合計100%になるように）。
    *   **キャリアの希望**: 同様に、将来の希望を分類・集計し、上位5項目を特定してパーセンテージで示してください（合計100%）。
    *   **共通の強み**: 相談者が認識している強みの中から、特に頻出するものを5つ挙げてください。

2.  **定性的分析 (総合インサイト)**:
    *   上記の定量的データを踏まえ、全体を通して見える重要なインサイトを記述してください。
    *   我々のコンサルティングサービスが、これらの傾向に対して今後どのように価値を提供できるか、具体的で実行可能な提言をMarkdown形式でまとめてください。レポートの構成は以下の通りです。
        *   ### 1. 相談者の共通の悩み・課題 (Common Challenges)
        *   ### 2. キャリアにおける希望・目標の傾向 (Career Aspirations)
        *   ### 3. 総合的なインサイトと提言 (Overall Insights & Recommendations)

---
【分析対象のサマリー群】
${summariesText}
---
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
             temperature: 0.3,
             responseMimeType: "application/json",
             responseSchema: analysisSchema,
        }
    });
    const parsedData = JSON.parse(response.text.trim());
    return new Response(JSON.stringify({ analysis: parsedData }), { headers: { 'Content-Type': 'application/json' }});
}

async function handleAnalyzeIndividual(payload: { conversations: StoredConversation[], userId: string }): Promise<Response> {
    const { conversations, userId } = payload;
    const summariesText = conversations
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(conv => `--- 相談日時: ${new Date(conv.date).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ---\n${conv.summary}`)
        .join('\n\n');

    const analysisPrompt = `
あなたは、非常に洞察力のあるシニアキャリアコーチであり、キャリアアナリストでもあります。
以下は、特定のクライアント（ユーザーID: ${userId}）との過去のキャリア相談セッションのサマリー群です。
これらのサマリーを時系列で注意深く分析し、クライアントの思考や状況の変化、成長の軌跡を読み解いてください。
最終的なアウトプットとして、**以下の全ての要素を含む、コンサルタント向けの詳細な分析レポート**を、指定されたJSONスキーマに従って生成してください。

### **分析の指示**

#### **パート1: 相談の軌跡分析**

1.  **基本情報の抽出**:
    *   相談の総数を特定してください。
    *   個々の相談について、相談日時と、サマリーの内容から推測されるおおよその相談時間（分単位）をリストアップしてください。

2.  **深層分析**:
    *   **キーテーマの特定**: 複数の相談を通じて、繰り返し現れる中心的なテーマや悩み、関心事を3〜5つ抽出してください。
    *   **強みの発見**: クライアントが自覚している強みだけでなく、対話の端々から読み取れる潜在的な強みや資質を3〜5つ挙げてください。
    *   **成長領域の示唆**: クライアントが今後キャリアを築く上で、伸ばすと良いと思われるスキルや視点、経験すべき領域を3〜5つ提案してください。
    *   **次のステップの提案**: このクライアントの現状と希望を踏まえ、次にコンサルタントとして提案すべき具体的なアクションや問いかけを3〜5つ考えてください。

3.  **総合サマリーの作成**:
    *   上記の分析をすべて統合し、このクライアントのキャリア相談の旅路を物語るように、Markdown形式で総合的なサマリーを記述してください。初回相談時の状況から現在に至るまでの変化や成長、今後の課題などを明確に含めてください。

#### **パート2: 適性診断・スキルマッチング**

*   クライアントの人物像を分析し、**ユーザーに提示するレベルの「適性診断・スキルマッチングレポート」**を作成してください。
*   これには、\`analysisSummary\`、\`recommendedRoles\`、\`skillsToDevelop\`、\`learningResources\` の全ての要素を含めてください。
*   URLは架空のものではなく、実際にアクセス可能な有効なものを記載してください。

#### **パート3: コンサルタント向け追加インサイト (隠れたスキル)**

*   **隠れたスキルの特定**: パート2でクライアントに直接提示したスキル以外に、コンサルタントとして知っておくべき**「隠れたスキル」**を2〜3つ特定してください。
*   「隠れたスキル」とは、以下のようなものを指します：
    *   まだ萌芽期だが、将来的に大きな強みになりうる潜在的な能力。
    *   クライアント自身が気づいていない、または過小評価している資質。
    *   推奨職種とは直接結びつかないかもしれないが、キャリアの選択肢を広げる可能性のあるスキル。
*   なぜそれが重要だと考えたのか、コンサルタント向けの理由を簡潔に添えてください。

---
【分析対象: ユーザーID "${userId}" の相談サマリー群】
${summariesText}
---
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: individualAnalysisSchema,
        }
    });
    const parsedData = JSON.parse(response.text.trim());
    return new Response(JSON.stringify({ analysis: parsedData }), { headers: { 'Content-Type': 'application/json' }});
}

async function handleSummarizeText(payload: { textToAnalyze: string }): Promise<Response> {
    const { textToAnalyze } = payload;
    const summaryPrompt = `
あなたは、プロのキャリアコンサルタントです。以下のテキストは、ある人物のキャリアに関する自由形式のメモです。この内容を分析し、キャリア相談のサマリーとして構造化されたMarkdownテキストを生成してください。このサマリーは、後続の面談を担当する他のコンサルタントが、短時間でクライアントの全体像を把握できるようにするためのものです。

要約は、以下の項目を網羅し、**各項目では箇条書き（ブレットポイント）を積極的に使用して**、情報を簡潔かつ明瞭にまとめてください。

---

### 相談の要点 (3点まとめ)
- テキスト全体から最も重要なポイントを3つの箇条書きで簡潔にまとめてください。

### クライアントの現状
- 職種、業界、現在の役割、経験年数などを箇条書きで記述してください。

### 満足点・やりがい
- 現状の仕事でポジティブに感じていることを具体的に箇条書きで記述してください。

### 課題・悩み
- 改善したいと考えていること、ストレスの要因などを具体的に箇条書きで記述してください。

### 将来の希望
- 今後目指したいキャリアの方向性、興味のある分野などを具体的に箇条書きで記述してください。

### 強み・スキル
- テキストから読み取れる、クライアントが自己認識している長所や得意なことを箇条書きで記述してください。

### 特記事項
- その他、コンサルタントが知っておくべき重要な情報があれば記述してください。

---

もしテキストから情報が読み取れない項目があっても、見出しは必ず含め、「情報なし」などと記述してください。
出力はMarkdown形式のテキストのみとしてください。

---
【分析対象のテキスト】
${textToAnalyze}
---
`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: summaryPrompt,
    });
    return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' }});
}

async function handleSkillMatch(payload: { conversations: StoredConversation[] }): Promise<Response> {
    const { conversations } = payload;
    const summariesText = conversations
        .map((conv, index) => `--- 相談サマリー ${index + 1} ---\n${conv.summary}`)
        .join('\n\n');

    const analysisPrompt = `
あなたは、キャリア開発と人材育成を専門とするプロのキャリアアナリストです。
以下に、一人のクライアントとの過去のキャリア相談セッションのサマリーが提供されます。
これらの情報全体を深く分析し、クライアントの隠れた才能、興味、価値観を読み解いてください。

最終的なアウトプットとして、クライアントの未来の可能性を広げるための、具体的でポジティブな「適性診断・スキルマッチングレポート」を、指定されたJSONスキーマに従って生成してください。

### **分析の指示**

1.  **総合分析サマリー (analysisSummary)**:
    *   提供されたサマリー全体から、クライアントの強み、弱み、興味の方向性、仕事に対する価値観などを統合し、人物像を要約してください。Markdown形式で記述してください。

2.  **推奨職種 (recommendedRoles)**:
    *   分析した人物像に基づき、クライアントが活躍できそうな職種を3〜5つ提案してください。
    *   それぞれの職種について、なぜそれが適しているのかという理由を具体的に記述してください。
    *   クライアントとの適性度を、0から100の**マッチ度 (matchScore)**として数値で示してください。

3.  **今後伸ばすべきスキル (skillsToDevelop)**:
    *   推奨した職種に到達するために、あるいは現在のキャリアをさらに発展させるために、学習・強化すると良い具体的なスキルをリストアップしてください。
    *   なぜそのスキルが重要なのか、理由も添えてください。

4.  **学習リソースの提案 (learningResources)**:
    *   上記のスキルを学ぶための、具体的なオンラインリソース（コース、記事、ビデオなど）を3〜5つ提案してください。
    *   リソースの種類（course, book, article, video）とURLを必ず含めてください。URLは架空のものではなく、実際にアクセス可能な有効なものを記載してください。

---
【分析対象のサマリー群】
${summariesText}
---
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            temperature: 0.5,
            responseMimeType: "application/json",
            responseSchema: skillMatchingSchema,
        }
    });
    const parsedData = JSON.parse(response.text.trim());
    return new Response(JSON.stringify({ result: parsedData }), { headers: { 'Content-Type': 'application/json' }});
}


// --- Main Vercel Handler ---

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
      case 'analyzeIndividual':
        return await handleAnalyzeIndividual(payload);
      case 'summarizeText':
        return await handleSummarizeText(payload);
      case 'skillMatch':
        return await handleSkillMatch(payload);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error(`Error in proxy function:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
