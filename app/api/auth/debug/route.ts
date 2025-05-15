// app/api/auth/debug/route.ts
// Supabase認証状態の診断用エンドポイント
// 更新日: 2025/8/28 - セキュリティ強化: 本番環境ではキー情報を制限

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 環境変数からSupabase設定を取得
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // 基本的な診断情報
    const diagnostics: Record<string, any> = {
      environment: process.env.NODE_ENV,
      supabaseUrl: isDevelopment ? supabaseUrl : '本番環境では非表示',
      supabaseKeyExists: !!supabaseKey,
      // セキュリティのためキー情報は制限
      supabaseKeyPreview: isDevelopment 
        ? (supabaseKey ? `${supabaseKey.substring(0, 5)}...` : '未設定')
        : '本番環境では非表示',
    };
    
    // 本番環境では接続テストのみ実行し、詳細は返さない
    if (supabaseUrl && supabaseKey) {
      try {
        // 直接APIリクエストを送信してテスト
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: 'test@example.com', 
            password: 'invalid_password_for_testing_only'
          })
        });
        
        // 開発環境でのみ詳細情報を返す
        if (isDevelopment) {
          const responseData = await response.json();
          diagnostics.connectionTest = {
            success: response.status !== 401, // 401はAPIキーの問題
            status: response.status,
            statusText: response.statusText,
            responseData
          };
        } else {
          // 本番環境では最小限の情報のみ
          diagnostics.connectionTest = {
            success: response.status !== 401,
            status: response.status
          };
        }
      } catch (error: any) {
        diagnostics.connectionTest = {
          success: false,
          error: isDevelopment ? error.message : '接続エラー (詳細は本番環境では非表示)'
        };
      }
    }
    
    // 環境変数デバッグ - 開発環境のみ
    if (isDevelopment) {
      diagnostics.envVars = {
        NODE_ENV: process.env.NODE_ENV,
        // その他の非機密環境変数
      };
    }
    
    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: process.env.NODE_ENV !== 'production' ? error.message : 'エラーが発生しました',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, { status: 500 });
  }
} 