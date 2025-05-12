// __tests__/services/api/bitget/utils.test.ts
// 作成: Bitget APIユーティリティ関数のテスト

import { 
  formatSymbol, 
  normalizeSymbol, 
  normalizeFuturesSymbol, 
  isSupportedFuturesSymbol 
} from '../../../../services/api/bitget/utils';

describe('Bitget APIユーティリティ関数', () => {
  describe('formatSymbol', () => {
    it('スラッシュを削除して大文字に変換すること', () => {
      expect(formatSymbol('btc/usdt')).toBe('BTCUSDT');
      expect(formatSymbol('ETH/USDT')).toBe('ETHUSDT');
      expect(formatSymbol('SOL/USDT')).toBe('SOLUSDT');
    });

    it('すでに正しい形式の場合はそのまま返すこと', () => {
      expect(formatSymbol('BTCUSDT')).toBe('BTCUSDT');
    });
  });

  describe('normalizeFuturesSymbol', () => {
    it('_UMCBLサフィックスを削除すること', () => {
      expect(normalizeFuturesSymbol('BTCUSDT_UMCBL')).toBe('BTCUSDT');
      expect(normalizeFuturesSymbol('ETHUSDT_UMCBL')).toBe('ETHUSDT');
    });

    it('サフィックスがない場合はそのまま返すこと', () => {
      expect(normalizeFuturesSymbol('BTCUSDT')).toBe('BTCUSDT');
    });

    it('大文字小文字を区別せずにサフィックスを削除すること', () => {
      expect(normalizeFuturesSymbol('BTCUSDT_umcbl')).toBe('BTCUSDT');
    });
  });

  describe('normalizeSymbol', () => {
    it('スポット取引の場合はformatSymbolと同じ動作をすること', () => {
      expect(normalizeSymbol('btc/usdt', 'spot')).toBe('BTCUSDT');
      expect(normalizeSymbol('ETH/USDT', 'spot')).toBe('ETHUSDT');
    });

    it('先物取引の場合はUMCBLサフィックスを削除すること', () => {
      expect(normalizeSymbol('BTCUSDT_UMCBL', 'futures')).toBe('BTCUSDT');
      expect(normalizeSymbol('btc/usdt', 'futures')).toBe('BTCUSDT');
    });
  });

  describe('isSupportedFuturesSymbol', () => {
    it('サポートされている先物シンボルを正しく判定すること', () => {
      expect(isSupportedFuturesSymbol('BTCUSDT')).toBe(true);
      expect(isSupportedFuturesSymbol('ETHUSDT')).toBe(true);
      expect(isSupportedFuturesSymbol('SOLUSDT')).toBe(true);
    });

    it('サポートされていない先物シンボルを正しく判定すること', () => {
      expect(isSupportedFuturesSymbol('ETHBTC')).toBe(false); // BTC建ての通貨ペア
      expect(isSupportedFuturesSymbol('BTCUSDC')).toBe(false); // USDC建ての通貨ペア
    });

    it('_UMCBLサフィックス付きでも正しく判定すること', () => {
      expect(isSupportedFuturesSymbol('BTCUSDT_UMCBL')).toBe(true);
      expect(isSupportedFuturesSymbol('ETHBTC_UMCBL')).toBe(false);
    });
  });
});
