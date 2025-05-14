// src/mastra/integrations/mem0-supabase.ts
// Mem0統合クラス - SupabaseとMem0APIの連携を実装
// 作成日: 2025/5/31

import { Mem0Integration } from "@mastra/mem0";
import { 
  createMemory, 
  getMemoryByExternalId,
  searchMemoriesBySimilarity,
  updateMemory
} from "@/lib/supabase/supabase-memory";

/**
 * SupabaseMem0Integration - Mem0APIとSupabaseを連携するクラス
 * メモリの二重保存と同期機能を提供します
 */
export class SupabaseMem0Integration {
  private mem0: Mem0Integration;
  private userId: string;

  /**
   * コンストラクタ
   * @param config 設定オブジェクト
   */
  constructor({
    apiKey,
    userId = "anon"
  }: {
    apiKey: string;
    userId?: string;
  }) {
    // Mem0 Integrationをセットアップ
    this.mem0 = new Mem0Integration({
      config: {
        apiKey,
        userId
      }
    });
    
    this.userId = userId;
  }

  /**
   * メモリを作成（Mem0APIとSupabaseの両方に保存）
   * @param content メモリ内容
   * @returns 作成結果
   */
  async createMemory(content: string): Promise<boolean> {
    try {
      // まずMem0APIに保存
      const mem0Result = await this.mem0.createMemory(content);
      
      if (mem0Result) {
        // Mem0APIでの保存に成功したら、SupabaseにもバックアップとしてID付きで保存
        try {
          // Mem0APIの内部実装詳細に依存しますが、ここではメモリIDを取得できると仮定
          // 実際の実装では適切なIDの取得方法が必要です
          const externalId = extractMemoryId(mem0Result) || generateUniqueId();
          
          // Supabaseに保存
          await createMemory(
            this.userId,
            content,
            externalId,
            { source: "mem0-api", timestamp: new Date().toISOString() }
          );
          
          return true;
        } catch (supabaseError) {
          console.error("Supabaseへのメモリ保存エラー:", supabaseError);
          // Mem0APIには保存できているので、trueを返す
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("メモリ作成エラー:", error);
      
      // Mem0APIに保存できなかった場合、Supabaseのみに保存を試みる
      try {
        await createMemory(
          this.userId,
          content,
          null, // 外部IDなし
          { source: "local-only", timestamp: new Date().toISOString() }
        );
        
        return true;
      } catch (supabaseError) {
        console.error("フォールバック保存エラー:", supabaseError);
        return false;
      }
    }
  }

  /**
   * メモリを検索（Mem0APIとSupabaseの両方から検索）
   * @param query 検索クエリ
   * @returns 検索結果
   */
  async searchMemory(query: string): Promise<string> {
    try {
      // まずMem0APIで検索
      const mem0Result = await this.mem0.searchMemory(query);
      
      if (mem0Result && mem0Result.trim() !== "") {
        return mem0Result;
      }
      
      // Mem0APIで結果が得られなかった場合、Supabaseで検索
      const supabaseResults = await searchMemoriesBySimilarity(this.userId, query);
      
      if (supabaseResults && supabaseResults.length > 0) {
        // 最も類似度の高い結果を使用
        return supabaseResults[0].content;
      }
      
      // 結果が見つからない場合
      return "";
    } catch (error) {
      console.error("メモリ検索エラー:", error);
      
      // Mem0APIでエラーが発生した場合、Supabaseのみで検索
      try {
        const supabaseResults = await searchMemoriesBySimilarity(this.userId, query);
        
        if (supabaseResults && supabaseResults.length > 0) {
          return supabaseResults[0].content;
        }
      } catch (supabaseError) {
        console.error("Supabase検索エラー:", supabaseError);
      }
      
      return "";
    }
  }

  /**
   * メモリを同期（Supabaseから未同期のメモリをMem0APIに同期）
   * 注: バックグラウンドジョブとして実行することを想定
   * @returns 同期結果
   */
  async syncMemories(): Promise<{ success: boolean; syncedCount: number }> {
    // 実装未完了 - 未同期メモリをSupabaseから取得し、Mem0APIに送信する処理
    return { success: true, syncedCount: 0 };
  }

  /**
   * ユーザーIDを取得
   * @returns 現在のユーザーID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * ユーザーIDを設定
   * @param userId 新しいユーザーID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    // Mem0インスタンスのユーザーIDも更新
    this.mem0 = new Mem0Integration({
      config: {
        apiKey: (this.mem0 as any).config.apiKey,
        userId
      }
    });
  }
}

/**
 * ヘルパー関数: Mem0APIの結果からメモリIDを抽出
 * 注: 実際の実装はMem0APIの仕様に合わせる必要があります
 */
function extractMemoryId(result: any): string | null {
  // 仮の実装 - 実際のMem0APIの戻り値構造に合わせる必要があります
  if (typeof result === 'object' && result !== null && 'id' in result) {
    return result.id;
  }
  return null;
}

/**
 * ヘルパー関数: ユニークIDを生成
 */
function generateUniqueId(): string {
  return 'mem0-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
} 