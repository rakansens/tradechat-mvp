-- 04_initial_data.sql
-- 初期データ投入ファイル
-- 作成日: 2025/5/7

-- 管理者ユーザーの作成
-- 注意: 実際の環境では、auth.usersテーブルにユーザーを作成した後に
-- このSQLを実行する必要があります。ここではサンプルとして記述しています。
DO $$
BEGIN
  -- 開発環境でのみ実行し、auth.usersテーブルにデータがある場合のみ実行
  IF current_setting('app.environment', TRUE) = 'development' THEN
    -- auth.usersテーブルにデータがあるか確認
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
      INSERT INTO users (id, email, is_admin, settings)
      VALUES
        ('00000000-0000-0000-0000-000000000000', 'admin@example.com', TRUE, '{"theme": "dark", "notifications": true}'::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        is_admin = EXCLUDED.is_admin,
        settings = EXCLUDED.settings;

      -- 管理者プロフィールの作成
      INSERT INTO profiles (id, user_id, display_name, avatar_url, bio)
      VALUES
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'システム管理者', 'https://example.com/admin-avatar.png', 'システム管理者アカウント')
      ON CONFLICT (id) DO NOTHING;
    ELSE
      RAISE NOTICE 'auth.usersテーブルに管理者ユーザーが存在しないため、スキップします';
    END IF;
  END IF;
END $$;

-- サンプルユーザーの作成（開発環境用）
-- 注意: 実際の環境では、auth.usersテーブルにユーザーを作成した後に
-- このSQLを実行する必要があります。ここではサンプルとして記述しています。
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- 開発環境でのみ実行
  IF current_setting('app.environment', TRUE) = 'development' THEN
    -- auth.usersテーブルにデータがあるか確認
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111') THEN
      -- サンプルユーザー1
      sample_user_id := '11111111-1111-1111-1111-111111111111';
      
      INSERT INTO users (id, email, is_admin, settings)
      VALUES
        (sample_user_id, 'user1@example.com', FALSE, '{"theme": "light", "notifications": true}'::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        is_admin = EXCLUDED.is_admin,
        settings = EXCLUDED.settings;
      
      INSERT INTO profiles (id, user_id, display_name, avatar_url, bio)
      VALUES
        (gen_random_uuid(), sample_user_id, 'サンプルユーザー1', 'https://example.com/user1-avatar.png', 'これはサンプルユーザー1です。')
      ON CONFLICT (id) DO NOTHING;
    ELSE
      RAISE NOTICE 'auth.usersテーブルにサンプルユーザー1が存在しないため、スキップします';
    END IF;
    
    -- auth.usersテーブルにデータがあるか確認
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '22222222-2222-2222-2222-222222222222') THEN
      -- サンプルユーザー2
      sample_user_id := '22222222-2222-2222-2222-222222222222';
      
      INSERT INTO users (id, email, is_admin, settings)
      VALUES
        (sample_user_id, 'user2@example.com', FALSE, '{"theme": "dark", "notifications": false}'::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        is_admin = EXCLUDED.is_admin,
        settings = EXCLUDED.settings;
      
      INSERT INTO profiles (id, user_id, display_name, avatar_url, bio)
      VALUES
        (gen_random_uuid(), sample_user_id, 'サンプルユーザー2', 'https://example.com/user2-avatar.png', 'これはサンプルユーザー2です。')
      ON CONFLICT (id) DO NOTHING;
    ELSE
      RAISE NOTICE 'auth.usersテーブルにサンプルユーザー2が存在しないため、スキップします';
    END IF;
    
    -- サンプルシンボル設定
    INSERT INTO symbol_settings (id, user_id, symbol, is_favorite, display_order)
    VALUES
      (gen_random_uuid(), sample_user_id, 'BTCUSDT', TRUE, 1),
      (gen_random_uuid(), sample_user_id, 'ETHUSDT', TRUE, 2),
      (gen_random_uuid(), sample_user_id, 'BNBUSDT', FALSE, 3)
    ON CONFLICT (user_id, symbol) DO UPDATE
    SET
      is_favorite = EXCLUDED.is_favorite,
      display_order = EXCLUDED.display_order;
    
    -- サンプルチャート設定
    INSERT INTO chart_settings (id, user_id, timeframe, chart_type, show_volume, show_grid, show_legend, theme)
    VALUES
      (gen_random_uuid(), sample_user_id, '1h', 'candlestick', TRUE, TRUE, TRUE, 'dark')
    ON CONFLICT (id) DO NOTHING;
    
    -- サンプルエントリー
    INSERT INTO entries (id, user_id, side, symbol, price, time, take_profit, stop_loss, status, is_public)
    VALUES
      (gen_random_uuid(), sample_user_id, 'buy', 'BTCUSDT', 50000, NOW() - INTERVAL '1 day', 55000, 48000, 'open', TRUE),
      (gen_random_uuid(), sample_user_id, 'sell', 'ETHUSDT', 3000, NOW() - INTERVAL '2 days', 2800, 3100, 'closed', TRUE),
      (gen_random_uuid(), sample_user_id, 'buy', 'BNBUSDT', 400, NOW() - INTERVAL '3 days', 450, 380, 'canceled', FALSE)
    ON CONFLICT (id) DO NOTHING;
    
    -- サンプルチャットメッセージ
    INSERT INTO chat_messages (id, user_id, role, content, is_proposal, is_public, created_at)
    VALUES
      (gen_random_uuid(), sample_user_id, 'user', 'BTCUSDTの分析をお願いします', FALSE, TRUE, NOW() - INTERVAL '2 hours'),
      (gen_random_uuid(), sample_user_id, 'assistant', 'BTCUSDTの分析結果です。現在のトレンドは上昇傾向にあります。', FALSE, TRUE, NOW() - INTERVAL '1 hour 55 minutes'),
      (gen_random_uuid(), sample_user_id, 'user', 'エントリーポイントを提案してください', FALSE, TRUE, NOW() - INTERVAL '1 hour 50 minutes'),
      (gen_random_uuid(), sample_user_id, 'assistant', 'BTCUSDTの買いエントリーを提案します。', TRUE, TRUE, NOW() - INTERVAL '1 hour 45 minutes')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- キャッシュデータのサンプル（開発環境用）
DO $$
BEGIN
  -- 開発環境でのみ実行
  IF current_setting('app.environment', TRUE) = 'development' THEN
    INSERT INTO cached_data (id, data_type, symbol, timeframe, data, expires_at)
    VALUES
      (
        gen_random_uuid(),
        'klines',
        'BTCUSDT',
        '1h',
        '[
          {"open_time": 1714608000000, "open": "50000", "high": "51000", "low": "49800", "close": "50800", "volume": "1000", "close_time": 1714611600000},
          {"open_time": 1714611600000, "open": "50800", "high": "51200", "low": "50600", "close": "51000", "volume": "1200", "close_time": 1714615200000}
        ]'::jsonb,
        NOW() + INTERVAL '1 hour'
      ),
      (
        gen_random_uuid(),
        'ticker',
        'BTCUSDT',
        NULL,
        '{"price": "50800", "volume": "10000", "change": "1.6", "high": "51200", "low": "49800"}'::jsonb,
        NOW() + INTERVAL '5 minutes'
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 環境変数の設定（開発環境用）
DO $$
BEGIN
  -- 開発環境でのみ実行
  IF current_setting('app.environment', TRUE) != 'development' THEN
    RAISE NOTICE 'app.environment is not set to development, skipping environment variable setup';
  ELSE
    -- 環境変数の設定
    PERFORM set_config('app.environment', 'development', FALSE);
    PERFORM set_config('app.debug', 'true', FALSE);
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- app.environmentが設定されていない場合
    RAISE NOTICE 'app.environment is not set, assuming development environment';
END $$;