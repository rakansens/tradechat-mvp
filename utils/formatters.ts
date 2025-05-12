/**
 * utils/formatters.ts
 * フォーマット関連のユーティリティ関数
 */

/**
 * シンボル名を正規化する
 * @param symbol 元のシンボル名（例: 'BTC/USDT', 'BTC-USDT', 'BTCUSDT'）
 * @returns 正規化されたシンボル名（例: 'BTC/USDT'）
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  
  // すでに標準形式（BTC/USDT）の場合はそのまま返す
  if (symbol.includes('/')) return symbol;
  
  // ハイフン区切り（BTC-USDT）の場合はスラッシュに変換
  if (symbol.includes('-')) {
    return symbol.replace('-', '/');
  }
  
  // 区切りなし（BTCUSDT）の場合は一般的な通貨ペアの区切りを推測
  const commonQuoteCurrencies = ['USDT', 'USD', 'BTC', 'ETH', 'JPY', 'EUR', 'GBP'];
  
  for (const quote of commonQuoteCurrencies) {
    if (symbol.endsWith(quote)) {
      return `${symbol.slice(0, -quote.length)}/${quote}`;
    }
  }
  
  // 区切りが推測できない場合は、最後の3〜4文字を引用通貨と仮定
  const base = symbol.slice(0, -4);
  const quote = symbol.slice(-4);
  return `${base}/${quote}`;
}
