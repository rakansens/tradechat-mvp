// app/api/chat/route.ts
// チャットAPIエンドポイント
// 作成日: 2025/5/20
// 更新日: 2025/9/17 - systemPrompt配線対応

import type { NextRequest } from "next/server"
import { askAgent } from "@/lib/agent"
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient'
import { Database } from "@/types/network/supabase"

// Allow responses up to 5 minutes
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const supabase = await createRouteHandlerClient()

    // System prompt to define the AI's behavior
    const systemPrompt = `
あなたはTradeChatという名前のトレーディングアシスタントAIです。
ユーザーの質問に対して、チャート分析やトレードのアドバイスを日本語で提供します。

以下の機能を持っています：
1. チャート分析 - 現在表示されているBTC/USDのチャートデータを分析できます
2. エントリー提案 - 条件に基づいて買い/売りのエントリーポイントを提案できます
3. モック注文実行 - ユーザーが承認すれば、モックの注文を実行できます
4. ウェブ検索 - 最新の市場ニュースや価格情報を取得するためにウェブ検索を行えます

エントリーを提案する場合は、必ず「〜でエントリーしますか？」という形で質問してください。
これによりユーザーに「エントリー実行」ボタンが表示されます。

最新の市場情報が必要な場合は、browser_search関数を使用してウェブ検索を行ってください。
特に「最新」「ニュース」「今日の」などのキーワードがユーザーの質問に含まれている場合は、
積極的に検索ツールを使用してください。

チャートデータは仮想的なものであり、実際の市場データではありません。
これはデモンストレーション目的のみのものであることを明示してください。
`

    // ユーザーが「ビットコイン」だけを入力した場合のサンプル応答
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "user" &&
      messages[messages.length - 1].content.trim() === "ビットコイン"
    ) {
      return new Response(
        JSON.stringify({
          id: "sample-response",
          role: "assistant",
          content: `ビットコインのチャートを分析すると、現在のBTC/USD価格は60,500ドル付近で取引されています。

過去30日間のトレンドを見ると、価格は上昇トレンドにあり、50日移動平均線を上回っています。これは一般的に強気のシグナルとされています。

直近では、61,000ドル付近に抵抗線があり、この水準を突破できるかどうかが今後の動きの鍵となるでしょう。

現在の価格帯でビットコインを買いエントリーしますか？`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    // ユーザーが「最新ニュース」を入力した場合のサンプル応答
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "user" &&
      messages[messages.length - 1].content.includes("最新ニュース")
    ) {
      return new Response(
        JSON.stringify({
          id: "news-response",
          role: "assistant",
          content: `ビットコインに関する最新ニュースを検索しました：

1. ビットコイン価格は過去24時間で5%上昇し、現在61,200ドル付近で取引されています。
2. 米国の規制当局は新たな暗号資産関連の規制フレームワークを検討中と報じられています。
3. 大手金融機関がビットコインへの投資を検討しているとの報道があります。

詳細については、各ニュースソースをご確認ください。
`
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    // askAgent関数を使用して応答を取得
    const response = await askAgent(messages, {
      instructions: systemPrompt,
      supabaseClient: supabase
    })

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: "申し訳ありません、エラーが発生しました。もう一度お試しください。"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

