/**
 * @jest-environment jsdom
 * Supabaseエイリアスのテスト
 * 作成日: 2025-06-20
 * 
 * このテストはtsconfig.jsonとjest.config.jsの@/supabase/*エイリアスが
 * 正しく機能していることを確認します。
 */

import { createClient } from '@/supabase/client';
import { createClient as createServerClient } from '@/supabase/server';
import { createMiddlewareClient } from '@/supabase/middlewareClient';
import { createRouteHandlerClient } from '@/supabase/routeHandlerClient';

describe('Supabaseエイリアステスト', () => {
  test('@/supabaseのパスエイリアスが正しく機能している', () => {
    // 各クライアント作成関数が正しくインポートされていることを確認
    expect(createClient).toBeDefined();
    expect(typeof createClient).toBe('function');
    
    expect(createServerClient).toBeDefined();
    expect(typeof createServerClient).toBe('function');
    
    expect(createMiddlewareClient).toBeDefined();
    expect(typeof createMiddlewareClient).toBe('function');
    
    expect(createRouteHandlerClient).toBeDefined();
    expect(typeof createRouteHandlerClient).toBe('function');
  });
}); 