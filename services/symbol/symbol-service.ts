// services/symbol/symbol-service.ts
// 作成: シンボル関連の機能を提供するサービス層
// 
// このサービスはシンボル情報の取得、正規化、フィルタリングなどの機能を提供します。
// Zustandストアと分離し、ビジネスロジックをサービス層に移動させることで、
// コードの再利用性と保守性を向上させます。

import { getApiClient } from '../api/client-factory';
import { ExchangeType } from '@/types/api';
import { normalizeSymbol } from '@/lib/utils';
import { logger } from '@/utils/common';

// シンボル情報の型定義
export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isFavorite: boolean;
  // 取引量データ
  volume24h?: string; // 24時間取引量
  priceChangePercent24h?: string; // 24時間価格変動率
  lastPrice?: string; // 最新価格
}

// フィルターオプションの型定義
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

// シンボル変更履歴の型定義
export interface SymbolChangeHistory {
  from: string;
  to: string;
  timestamp: number;
  reason?: string;
}

// モックデータ（実際の実装では API から取得）
const mockSymbols: SymbolInfo[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFavorite: true },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', isFavorite: false },
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
   * @param exchangeType 取引種別
   * @returns シンボル情報の配列
   */
  async fetchSymbols(exchangeType: ExchangeType): Promise<SymbolInfo[]> {
    try {
      logger.info(`Fetching symbols for ${exchangeType}`, {
        component: 'SymbolService',
        action: 'fetchSymbols',
      });

      // 実際の実装ではAPIからデータを取得
      // ここではモックデータを返す
      const symbols = mockSymbols;

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
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.symbol.toLowerCase().includes(term) ||
          s.baseAsset.toLowerCase().includes(term) ||
          s.quoteAsset.toLowerCase().includes(term)
      );
    }

    // 基軸通貨でフィルター
    if (options.quoteAsset) {
      filtered = filtered.filter((s) => s.quoteAsset === options.quoteAsset);
    }

    // お気に入りでフィルター
    if (options.favoritesOnly) {
      filtered = filtered.filter((s) => s.isFavorite);
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
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // 基軸通貨がUSDTの銘柄を優先
      if (a.quoteAsset === 'USDT' && b.quoteAsset !== 'USDT') return -1;
      if (a.quoteAsset !== 'USDT' && b.quoteAsset === 'USDT') return 1;

      // 同じ基軸通貨の場合の並べ替えロジック
      if (a.quoteAsset === b.quoteAsset) {
        // 優先銘柄リストにある場合
        const aIndex = prioritySymbols.indexOf(a.baseAsset);
        const bIndex = prioritySymbols.indexOf(b.baseAsset);

        // 両方がリストにある場合はリスト順
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // 片方だけリストにある場合はそちらを優先
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // 取引量データがあれば、取引量の多い順に並べ替え
        if (a.volume24h && b.volume24h) {
          const aVolume = parseFloat(a.volume24h);
          const bVolume = parseFloat(b.volume24h);

          // 有効な数値の場合のみ比較
          if (!isNaN(aVolume) && !isNaN(bVolume) && aVolume !== bVolume) {
            return bVolume - aVolume; // 取引量の多い順
          }
        }

        // 価格変動率があれば、変動率の大きい順に並べ替え
        if (a.priceChangePercent24h && b.priceChangePercent24h) {
          const aChange = Math.abs(parseFloat(a.priceChangePercent24h));
          const bChange = Math.abs(parseFloat(b.priceChangePercent24h));

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
   * @returns 最後に使用した取引種別（なければspot）
   */
  getLastUsedExchangeType(): ExchangeType {
    if (typeof window === 'undefined') return 'spot';
    
    const storedExchangeType =
      localStorage.getItem('lastUsedExchangeType') ||
      localStorage.getItem('selectedInstrumentType');
      
    if (storedExchangeType && (storedExchangeType === 'spot' || storedExchangeType === 'futures')) {
      return storedExchangeType as ExchangeType;
    }
    
    return 'spot';
  }

  /**
   * 最後に使用した取引種別をローカルストレージに保存する
   * @param type 保存する取引種別
   */
  saveLastUsedExchangeType(type: ExchangeType): void {
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