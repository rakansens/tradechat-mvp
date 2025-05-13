# アクティブコンテキスト

## 現在の作業フォーカス

現在、「マルチスレッドチャット実装プロジェクト」を進行中です。このプロジェクトはNext.js 14のApp Routerを活用し、Zustand、Supabase、Mastraを統合して、ChatGPTライクな複数スレッド（conversation）機能を実装します。

### マルチスレッドチャット実装プロジェクト

このプロジェクトの目標は以下の通りです：

1. `/chat/<conversationId>`でスレッド切り替えが可能なUIを実装
2. スレッド別メモリとグローバルメモリの自動フォールバック機能
3. Supabase Realtimeを使用したストリーミング表示
4. タイトル入力のみの新規スレッド作成機能（system_promptは後から編集可能）

以下のフェーズでプロジェクトを進めています：

1. **データベース（Supabase/Postgres）**:
   - conversations テーブルの作成
   - chat_messages テーブルに conversation_id カラムと外部キー制約の追加
   - 既存メッセージの初期会話へのバックフィル
   - Row Level Security（RLS）の設定
   - インデックス作成

2. **API（Next 14 / App Router）**:
   - `/api/conversations`エンドポイント作成（GET/POST）
   - `/api/messages/[conversationId]`エンドポイント作成（GET/POST）
   - askAgent ヘルパー関数の拡張（threadId = conversationId）

3. **フロントエンド**:
   - App Router構造の実装 (`/app/(chat)/[id]/page.tsx`など)
   - Sidebar.tsx コンポーネントの作成
   - NewThreadModal.tsx コンポーネントの作成
   - useChatInteraction.ts フックの拡張
   - Zustand storeの conversation別ネームスペース化

4. **Mastra統合**:
   - threadId と instructions の引数として conversationId と system_prompt を渡すよう調整

## 最近の変更

H-0からH-6までのフックリファクタリングフェーズが完了し、フックのファイル構造が整理されました。また、types ディレクトリリファクタリングプロジェクトの T-0〜T-6 フェーズが完了しました。

現在は新たに「マルチスレッドチャット実装プロジェクト」を開始し、チャット機能を拡張して複数スレッドのサポートを追加しています。これにより、ユーザーは複数の会話を別々に管理でき、各会話に固有のコンテキストとメモリを持たせることができるようになります。

## アクティブな決定と考慮事項

- フックの命名と構造の一貫性を維持します
- ディレクトリ階層は機能ドメイン別に整理します
- バレルファイル（index.ts）を各ディレクトリに配置し、エクスポートを管理します
- 型定義ファイルはドメイン境界に従って整理し、越境を防止します
- 後方互換性を維持しながら段階的にリファクタリングを進めます 
- マルチスレッド実装において、既存の機能を最小限の変更で拡張します
- 新規スレッド作成では最初はタイトルのみを入力し、system_promptは後で編集可能にします
- スレッドメモリとグローバルメモリの両方を活用し、必要に応じてフォールバックします 