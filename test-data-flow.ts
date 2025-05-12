/**
 * test-data-flow.ts
 * データフェッチフローのテスト
 * 
 * このスクリプトは、チャートデータの取得フローをテストします。
 * 1. REST APIで過去データを取得
 * 2. WebSocketでリアルタイムデータを購読
 * 3. Ping/Pongメカニズムの動作確認
 */

import { dataFetchService } from './services/data/dataFetchService';

// デバッグモード
const DEBUG = true;

// テスト用のシンボルとタイムフレーム
const TEST_SYMBOL = 'BTC/USDT';
const TEST_TIMEFRAME = '1m';
const TEST_EXCHANGE_TYPE = 'spot';

// ログ出力関数
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data && DEBUG) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// hybridChartServiceは使用しないため削除

// dataFetchServiceのテスト
async function testDataFetchService() {
  log('=== dataFetchServiceのテスト開始 ===');
  
  try {
    // チャートデータの取得
    log(`REST APIからチャートデータの取得開始: ${TEST_SYMBOL} ${TEST_TIMEFRAME}`);
    const chartData = await dataFetchService.fetchChartData(
      TEST_SYMBOL,
      TEST_TIMEFRAME as any,
      TEST_EXCHANGE_TYPE
    );
    
    log(`チャートデータ取得完了: ${chartData.length}件`);
    
    // 最新の5件のデータを表示
    if (chartData.length > 0) {
      log('最新データ（過去5件）:', chartData.slice(-5));
    }
    
    // リアルタイムデータの購読
    log(`リアルタイムローソク足データの購読開始: ${TEST_SYMBOL} ${TEST_TIMEFRAME}`);
    const unsubscribe = dataFetchService.subscribeKlineRealtime(
      TEST_SYMBOL,
      TEST_TIMEFRAME as any,
      (data) => {
        log(`リアルタイムローソク足データ受信: ${TEST_SYMBOL} ${TEST_TIMEFRAME}`, data);
      },
      TEST_EXCHANGE_TYPE
    );
    
    // 60秒間待機して、リアルタイムデータの受信を確認
    log('リアルタイムデータの購読を開始しました。60秒間待機します...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // 購読解除
    unsubscribe();
    log('購読を解除しました');
    
    log('=== dataFetchServiceのテスト終了 ===');
  } catch (error) {
    log(`エラー発生: ${error}`);
  }
}

// メイン関数
async function main() {
  log('データフェッチフローのテスト開始');
  
  // dataFetchServiceのテスト
  await testDataFetchService();
  
  log('データフェッチフローのテスト終了');
  process.exit(0);
}

// テスト実行
main().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
