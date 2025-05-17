// services/symbol/symbol-service.ts
// 作成: シンボル情報を提供するサービス層
// 更新: 共通モジュールから型定義をインポートするように変更
// 
// このサービスはシンボル情報の取得、正規化、フィルタリングなどの機能を提供します。
// Zustandストアと分離し、ビジネスロジックをサービス層に移動させることで、
// コードの再利用性と保守性を向上させます。

import { getApiClient } from '../api/client-factory';
import { ExchangeProductType } from '@/types/constants/enums';
import { normalizeSymbol } from '@/lib/utils';
import { logger } from '@/utils/common';
import type { SymbolInfo } from '@/types/symbol';
import type { SymbolFilterOptions } from '@/types/common/symbol';
import { toCommonSymbol, toUISymbol } from '@/types/symbol/base';

// レガシーサポートのための型エイリアス
export type FilterOptions = SymbolFilterOptions;

// レガシー型定義
interface LegacySymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteCoin: string;
  favorite: boolean;
  displayName: string;
  pricePrecision: number;
  quantityPrecision: number;
  status: string;
  minNotional?: string;
  volume24h?: string;
  priceChangePercent24h?: string;
  lastPrice?: string;
}

// モックデータ（実際の実装では API から取得）
const mockSymbols: LegacySymbolInfo[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteCoin: 'USDT', favorite: true, displayName: 'BTC/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteCoin: 'USDT', favorite: false, displayName: 'ETH/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteCoin: 'USDT', favorite: false, displayName: 'BNB/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteCoin: 'USDT', favorite: false, displayName: 'ADA/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteCoin: 'USDT', favorite: false, displayName: 'DOGE/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteCoin: 'USDT', favorite: false, displayName: 'XRP/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteCoin: 'USDT', favorite: false, displayName: 'DOT/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteCoin: 'USDT', favorite: false, displayName: 'UNI/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteCoin: 'USDT', favorite: false, displayName: 'LTC/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteCoin: 'USDT', favorite: false, displayName: 'LINK/USDT', pricePrecision: 8, quantityPrecision: 8, status: 'TRADING' },
];

/**
 * シンボルサービスクラス
 * シンボル関連の操作を提供します
 */
class SymbolService {
  /**
   * シンボル形式を正規化する
   * @param symbol 正規化するシンボル
   * @returns 正規化されたシンボル
   */
  normalizeSymbol(symbol: string): string {
    return normalizeSymbol(symbol);
  }

  /**
   * シンボル一覧を取得する
   * @param exchangeType 取引タイプ（'spot' または 'futures'）
   * @returns シンボル情報の配列
   */
  async fetchSymbols(exchangeType: ExchangeProductType): Promise<SymbolInfo[]> {
    try {
      logger.info(`Fetching symbols for ${exchangeType}`, {
        component: 'SymbolService',
        action: 'fetchSymbols',
      });

      // モックデータを取得し共通型に変換
      const legacySymbols = mockSymbols;
      const symbols = legacySymbols.map(symbol => toCommonSymbol(symbol, exchangeType));

      // シンボルをソート
      const sortedSymbols = this.sortSymbols(symbols);

      return sortedSymbols;
    } catch (error) {
      logger.error(`Failed to fetch symbols: ${error}`, {
        component: 'SymbolService',
        action: 'fetchSymbols',
        error,
      });
      throw error;
    }
  }

  /**
   * 指定されたフィルターに基づいてシンボルをフィルタリングする
   * @param symbols フィルタリングするシンボル配列
   * @param options フィルターオプション
   * @returns フィルタリングされたシンボル配列
   */
  filterSymbols(symbols: SymbolInfo[], options: FilterOptions): SymbolInfo[] {
    let filtered = [...symbols];

    // 検索語でフィルター
    if (options.search) {
      const term = options.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.symbol.toLowerCase().includes(term) ||
          s.baseCoin.toLowerCase().includes(term) ||
          s.quoteCoin.toLowerCase().includes(term)
      );
    }

    // 基軸通貨でフィルター
    if (options.quoteAsset) {
      filtered = filtered.filter((s) => s.quoteCoin === options.quoteAsset);
    }

    // お気に入りでフィルター
    if (options.showFavoritesOnly) {
      filtered = filtered.filter((s) => s.favorite);
    }

    return filtered;
  }

  /**
   * シンボルを優先順位に基づいてソートする
   * @param symbols ソートするシンボル配列
   * @returns ソートされたシンボル配列
   */
  private sortSymbols(symbols: SymbolInfo[]): SymbolInfo[] {
    // 優先順位付けの設定
    const prioritySymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'MATIC', 'ADA', 'DOT', 'LINK'];

    // 銘柄を優先順位でソート
    return [...symbols].sort((a, b) => {
      // お気に入りを最優先
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;

      // 基軸通貨がUSDTの銘柄を優先
      if (a.quoteCoin === 'USDT' && b.quoteCoin !== 'USDT') return -1;
      if (a.quoteCoin !== 'USDT' && b.quoteCoin === 'USDT') return 1;

      // 同じ基軸通貨の場合の並べ替えロジック
      if (a.quoteCoin === b.quoteCoin) {
        // 優先銘柄リストにある場合
        const aIndex = prioritySymbols.indexOf(a.baseCoin);
        const bIndex = prioritySymbols.indexOf(b.baseCoin);

        // 両方がリストにある場合はリスト順
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // 片方だけリストにある場合はそちらを優先
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // レガシーUI属性を取得するための変換
        const aUI = toUISymbol(a);
        const bUI = toUISymbol(b);

        // 取引量データがあれば、取引量の多い順に並べ替え
        if (aUI.volume24h && bUI.volume24h) {
          const aVolume = parseFloat(aUI.volume24h);
          const bVolume = parseFloat(bUI.volume24h);

          // 有効な数値の場合のみ比較
          if (!isNaN(aVolume) && !isNaN(bVolume) && aVolume !== bVolume) {
            return bVolume - aVolume; // 取引量の多い順
          }
        }

        // 価格変動率があれば、変動率の大きい順に並べ替え
        if (aUI.priceChangePercent24h && bUI.priceChangePercent24h) {
          const aChange = Math.abs(parseFloat(aUI.priceChangePercent24h));
          const bChange = Math.abs(parseFloat(bUI.priceChangePercent24h));

          // 有効な数値の場合のみ比較
          if (!isNaN(aChange) && !isNaN(bChange) && aChange !== bChange) {
            return bChange - aChange; // 変動率の大きい順
          }
        }
      }

      // それ以外はアルファベット順
      return a.symbol.localeCompare(b.symbol);
    });
  }

  /**
   * 最後に使用したシンボルをローカルストレージから取得する
   * @returns 最後に使用したシンボル（なければ空文字）
   */
  getLastUsedSymbol(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('lastUsedSymbol') || '';
  }

  /**
   * 最後に使用したシンボルをローカルストレージに保存する
   * @param symbol 保存するシンボル
   */
  saveLastUsedSymbol(symbol: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastUsedSymbol', symbol);
    }
  }

  /**
   * 最後に使用した取引種別をローカルストレージから取得する
   * @returns 最後に使用した取引種別（なければ'spot'）
   */
  getLastUsedExchangeType(): ExchangeProductType {
    if (typeof window === 'undefined') return 'spot';
    const stored = localStorage.getItem('lastUsedExchangeType');
    return stored && (stored === 'spot' || stored === 'futures') ? stored : 'spot';
  }

  /**
   * 最後に使用した取引タイプをローカルストレージに保存する
   * @param type 保存する取引タイプ（'spot' または 'futures'）
   */
  saveLastUsedExchangeType(type: ExchangeProductType): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastUsedExchangeType', type);
      localStorage.setItem('selectedInstrumentType', type); // 互換性のため
    }
  }
}

// シングルトンインスタンスをエクスポート
export const symbolService = new SymbolService();

// デフォルトエクスポート
export default symbolService; 