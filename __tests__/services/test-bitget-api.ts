/**
 * Bitget API テストスクリプト
 * 
 * 使用方法:
 * ts-node test-bitget-api.ts
 */

import { BitgetApiClient } from '../../services/api/bitget/client';
import { ProductType } from '@/types/api';
import { OHLCData } from '../../types/chart';

// テスト設定
const TEST_SYMBOLS = ['BTC/USDT', 'ETH/USDT'];
const TEST_TIMEFRAMES = ['1m', '1h', '1d'];
const PRODUCT_TYPES: ProductType[] = ['spot', 'futures'];

async function testHistoricalData() {
  console.log('=== 過去のローソク足データ取得テスト ===');
  
  for (const productType of PRODUCT_TYPES) {
    console.log(`\n[${productType.toUpperCase()}取引のテスト]`);
    const api = new BitgetApiClient({}, productType);
    
    for (const symbol of TEST_SYMBOLS) {
      for (const timeframe of TEST_TIMEFRAMES) {
        try {
          console.log(`${symbol} ${timeframe} のデータを取得中...`);
          const data = await api.fetchCandles(symbol, timeframe, 10);
          console.log(`✅ 成功: ${data.length}件のデータを取得: ${symbol} ${timeframe}`);
          
          if (data.length > 0) {
            const firstCandle = data[0];
            console.log('  最初のローソク足:', {
              time: new Date(firstCandle.time).toISOString(),
              open: firstCandle.open,
              high: firstCandle.high,
              low: firstCandle.low,
              close: firstCandle.close,
              volume: firstCandle.volume
            });
          }
        } catch (error) {
          console.error(`❌ エラー (${exchangeType} ${symbol} ${timeframe}):`, error instanceof Error ? error.message : error);
        }
      }
    }
  }
}

// WebSocketのテスト（選択したシンボルとタイムフレームに対して）
function testWebSocket() {
  console.log('\n=== WebSocketリアルタイムデータテスト ===');
  
  // スポット取引でのWebSocketテスト
  const symbol = 'BTC/USDT';
  const timeframe = '1m';
  
  console.log(`WebSocket接続をテスト中... (${symbol} ${timeframe})`);
  const api = new BitgetApiClient({}, 'spot' as ProductType);
  
  // WebSocket接続を確立
  api.connectWebSocket();
  
  // データ購読とコールバック設定
  api.subscribeCandles(symbol, timeframe, (data: OHLCData) => {
    console.log('リアルタイムデータを受信:', {
      time: new Date(data.time).toISOString(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    });
  });
  
  console.log(`WebSocketサブスクリプション開始: ${symbol} ${timeframe}`);
  console.log('30秒後に接続を終了します...');
  
  // 30秒後に接続を閉じる
  setTimeout(() => {
    api.disconnectWebSocket();
    console.log('WebSocket接続を終了しました');
    process.exit(0);
  }, 30000);
}

// テスト実行
async function runTests() {
  try {
    await testHistoricalData();
    testWebSocket();
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

runTests(); 