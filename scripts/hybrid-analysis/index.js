// scripts/hybrid-analysis/index.js
// ハイブリッド・マルチタイムフレーム分析のエントリーポイント
// 複数タイムフレームでのチャート分析と統合レポートを生成します

// コアモジュールのインポート
const { runOptimizedHybridAnalysis, runOptimizedMultiTimeframeAnalysis } = require('./core/analyzer');

// メイン実行関数
async function main() {
  const symbol = process.argv[2] || 'BTC/USDT';
  const timeframe = process.argv[3] || '1d';
  const multiTimeframe = process.argv[4] === 'multi' || false;
  
  try {
    // メモリ使用量のログ出力
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    const memoryData = process.memoryUsage();
    
    console.log('初期メモリ使用量:');
    console.log(`- RSS: ${formatMemoryUsage(memoryData.rss)}`);
    console.log(`- Heap Total: ${formatMemoryUsage(memoryData.heapTotal)}`);
    console.log(`- Heap Used: ${formatMemoryUsage(memoryData.heapUsed)}`);
    console.log(`- External: ${formatMemoryUsage(memoryData.external)}`);
    
    if (multiTimeframe) {
      console.log(`複数タイムフレーム最適化分析を開始: ${symbol}`);
      const timeframes = ['15m', '1h', '4h', '1d'];
      const result = await runOptimizedMultiTimeframeAnalysis(symbol, timeframes);
      
      if (result.success) {
        console.log('複数タイムフレーム分析が成功しました');
        console.log('\n===== 総合分析結果 =====\n');
        console.log(result.combinedAnalysis);
      } else {
        console.error('複数タイムフレーム分析に失敗しました:', result.error);
        process.exit(1);
      }
    } else {
      console.log(`単一タイムフレーム最適化分析を開始: ${symbol} (${timeframe})`);
      const result = await runOptimizedHybridAnalysis(symbol, timeframe);
      
      if (result.success) {
        console.log('ハイブリッド分析が成功しました');
        console.log('\n===== 分析結果 =====\n');
        console.log(result.analysis);
      } else {
        console.error('ハイブリッド分析に失敗しました:', result.error);
        process.exit(1);
      }
    }
    
    // 最終メモリ使用量
    const finalMemoryData = process.memoryUsage();
    console.log('\n最終メモリ使用量:');
    console.log(`- RSS: ${formatMemoryUsage(finalMemoryData.rss)}`);
    console.log(`- Heap Total: ${formatMemoryUsage(finalMemoryData.heapTotal)}`);
    console.log(`- Heap Used: ${formatMemoryUsage(finalMemoryData.heapUsed)}`);
    console.log(`- External: ${formatMemoryUsage(finalMemoryData.external)}`);
    
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

// モジュールとしてエクスポート
module.exports = {
  runHybridAnalysis: runOptimizedHybridAnalysis,
  runMultiTimeframeAnalysis: runOptimizedMultiTimeframeAnalysis
};
