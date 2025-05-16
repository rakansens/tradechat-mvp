/**
 * services/api/bitget/demo-generator.ts
 * Bitget APIのデモデータ生成クラス
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリング
 * 更新: 共通モジュールから型定義をインポートするように変更
 * 
 * このファイルは、テストやフォールバック用のデモデータ生成を担当します。
 */

import { OHLCData } from '../../../types/chart';
import { OrderBookData } from '../../../types/market';
import { ExchangeType } from '../../../types/network/api';
import { SymbolInfo } from '../../../types/common/symbol';
import { LegacySymbolInfo, toCommonSymbol } from '../../../types/symbol/base';
import { logger } from '@/utils/common';

/**
 * BitgetDemoGeneratorクラス
 * テストやフォールバック用のデモデータ生成を担当
 */
export class BitgetDemoGenerator {
  private isInDemoMode: boolean = false;

  /**
   * コンストラクタ
   */
  constructor() {
    logger.info('BitgetDemoGenerator initialized', {
      component: 'BitgetDemoGenerator',
      action: 'constructor'
    });
  }

  /**
   * デモモードの状態を取得
   * @returns デモモードかどうか
   */
  isInDemoModeEnabled(): boolean {
    return this.isInDemoMode;
  }

  /**
   * デモモードを有効化
   */
  enableDemoMode(): void {
    this.isInDemoMode = true;
    logger.info('Demo mode enabled', {
      component: 'BitgetDemoGenerator',
      action: 'enableDemoMode'
    });
  }

  /**
   * デモモードを無効化
   */
  disableDemoMode(): void {
    this.isInDemoMode = false;
    logger.info('Demo mode disabled', {
      component: 'BitgetDemoGenerator',
      action: 'disableDemoMode'
    });
  }

  /**
   * デモ用のキャンドルデータを生成
   * @param count 生成するキャンドル数
   * @returns デモ用ローソク足データ
   */
  generateDemoCandles(count: number): OHLCData[] {
    this.enableDemoMode();
    
    logger.info('Generating demo candle data', {
      component: 'BitgetDemoGenerator',
      action: 'generateDemoCandles',
      count
    });
    
    const now = Date.now();
    const candles: OHLCData[] = [];
    
    // BTCの場合はそれらしい価格を使用
    const basePrice = 65000; // 基本価格
    const volatility = 1000; // 価格変動幅
    
    for (let i = 0; i < count; i++) {
      const time = now - i * 86400000; // 1日ごと
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility * 0.5;
      const high = Math.max(open, close) + Math.random() * volatility * 0.2;
      const low = Math.min(open, close) - Math.random() * volatility * 0.2;
      const volume = 100 + Math.random() * 200;
      
      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    // 時間の降順でソート
    return candles.sort((a, b) => b.time - a.time);
  }

  /**
   * デモ用の注文板データを生成
   * @param symbol シンボル
   * @param depth 生成する深さ
   * @returns デモ用注文板データ
   */
  generateDemoOrderBook(symbol: string, depth: number = 10): OrderBookData {
    this.enableDemoMode();
    
    logger.info('Generating demo order book data', {
      component: 'BitgetDemoGenerator',
      action: 'generateDemoOrderBook',
      symbol,
      depth
    });
    
    const basePrice = 50000; // 基準価格
    const asks: [string, string][] = [];
    const bids: [string, string][] = [];
    
    // 売り注文（asks）を生成
    for (let i = 0; i < depth; i++) {
      const price = (basePrice + (i + 1) * 10).toFixed(2);
      const amount = (Math.random() * 2 + 0.1).toFixed(6);
      asks.push([price, amount]);
    }
    
    // 買い注文（bids）を生成
    for (let i = 0; i < depth; i++) {
      const price = (basePrice - (i + 1) * 10).toFixed(2);
      const amount = (Math.random() * 2 + 0.1).toFixed(6);
      bids.push([price, amount]);
    }
    
    return {
      symbol: symbol,
      asks,
      bids,
      timestamp: Date.now()
    };
  }

  /**
   * デモ用の銘柄データを生成する
   * @param exchangeType 取引種別
   * @returns デモ用の銘柄情報の配列
   */
  generateDummySymbols(exchangeType: ExchangeType): SymbolInfo[] {
    this.enableDemoMode();
    
    logger.info('Generating demo symbols', {
      component: 'BitgetDemoGenerator',
      action: 'generateDummySymbols',
      exchangeType
    });
    
    // 主要な仮想通貨ペアのリスト
    const mainPairs = [
      { base: 'BTC', quote: 'USDT' },
      { base: 'ETH', quote: 'USDT' },
      { base: 'XRP', quote: 'USDT' },
      { base: 'BNB', quote: 'USDT' },
      { base: 'ADA', quote: 'USDT' },
      { base: 'SOL', quote: 'USDT' },
      { base: 'DOT', quote: 'USDT' },
      { base: 'DOGE', quote: 'USDT' },
      { base: 'AVAX', quote: 'USDT' },
      { base: 'MATIC', quote: 'USDT' }
    ];
    
    // 現在時刻を取得
    const now = Date.now();
    
    // ダミーの銘柄情報を生成（レガシータイプで生成し、共通タイプに変換）
    const legacySymbols = mainPairs.map(({ base, quote }) => {
      // 基準価格（BTCは高め、他はそれなりの価格）
      const basePrice = base === 'BTC' ? 50000 : base === 'ETH' ? 3000 : Math.random() * 100 + 1;
      
      // 24時間の価格変動率（-5%〜+5%）
      const priceChangePercent = (Math.random() * 10 - 5).toFixed(2);
      
      // 現在価格（基準価格に価格変動を適用）
      const lastPrice = (basePrice * (1 + parseFloat(priceChangePercent) / 100)).toFixed(2);
      
      // 24時間の取引量（1000万〜1億）
      const volume24h = (Math.random() * 90000000 + 10000000).toFixed(2);
      
      return {
        symbol: `${base}${quote}`,
        baseAsset: base,
        quoteCoin: quote,
        displayName: `${base}/${quote}`,
        pricePrecision: 8,
        quantityPrecision: 8,
        minNotional: '10',
        status: 'TRADING',
        volume24h,
        priceChangePercent,
        lastPrice,
        favorite: false
      } as LegacySymbolInfo;
    });
    
    // レガシータイプから共通タイプに変換
    return legacySymbols.map(symbol => toCommonSymbol(symbol, exchangeType));
  }
}
