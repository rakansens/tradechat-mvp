// app/api/auth/debug/route.ts
// Supabase認証状態の診断用エンドポイント

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 環境変数からSupabase設定を取得
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // 基本的な診断情報
    const diagnostics: Record<string, any> = {
      environment: process.env.NODE_ENV,
      supabaseUrl: supabaseUrl || '未設定',
      supabaseKeyExists: !!supabaseKey,
      // セキュリティのため完全なキーは表示しない
      supabaseKeyPreview: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : '未設定',
    };
    
    // Supabase接続テスト
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
        
        // レスポンスを解析
        const responseData = await response.json();
        
        diagnostics.connectionTest = {
          success: response.status !== 401, // 401はAPIキーの問題
          status: response.status,
          statusText: response.statusText,
          responseData
        };
      } catch (error: any) {
        diagnostics.connectionTest = {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }
    
    // 環境変数デバッグ
    diagnostics.envVars = {
      NODE_ENV: process.env.NODE_ENV,
      // その他の非機密環境変数
    };
    
    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 