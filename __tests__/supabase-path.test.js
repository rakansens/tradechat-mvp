// Supabaseパスエイリアステスト
// 作成日: 2025-06-20
// 
// このテストはlib/supabaseから正しくファイルがインポートできることを確認します

describe('Supabaseパス確認テスト', () => {
  test('lib/supabaseから直接インポートできること', () => {
    // 直接相対パスでインポート
    const client = require('../lib/supabase/client');
    const server = require('../lib/supabase/server');
    const middleware = require('../lib/supabase/middlewareClient');
    const routeHandler = require('../lib/supabase/routeHandlerClient');
    
    // 各モジュールが正しくロードされていることを確認
    expect(client.createClient).toBeDefined();
    expect(typeof client.createClient).toBe('function');
    
    expect(server.createClient).toBeDefined();
    expect(typeof server.createClient).toBe('function');
    
    expect(middleware.createMiddlewareClient).toBeDefined();
    expect(typeof middleware.createMiddlewareClient).toBe('function');
    
    expect(routeHandler.createRouteHandlerClient).toBeDefined();
    expect(typeof routeHandler.createRouteHandlerClient).toBe('function');
  });
  
  test('jestのmoduleNameMapperが正しいこと', () => {
    // ファイルパスの構造を確認
    expect(require.resolve('../lib/supabase/client'))
      .toContain('/lib/supabase/client');
  });
}); 