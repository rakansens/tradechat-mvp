import { ExchangeType, ExchangeProductType } from '@/types/constants/enums';
import { toBitget } from '../utils/timeframe';
import { safeProductType } from '@/utils/exchangeTypeUtils';

export interface Subscription {
  instType: string;
  channel: string;
  instId: string;
}

export class SubscriptionManager {
  private subscriptions: Map<string, Set<string>> = new Map();

  public add(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): Subscription {
    const productType = safeProductType(exchangeType || 'spot');
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const instType = productType === 'spot' ? 'SP' : 'MC';
    const instId =
      productType === 'spot' ? formattedSymbol : `${formattedSymbol}_UMCBL`;

    let channel: string;
    switch (type) {
      case 'orderbook':
        channel = 'books';
        break;
      case 'kline':
        if (!timeframe) {
          throw new Error('Timeframe is required for kline subscription');
        }
        channel = `candle${toBitget(timeframe)}`;
        break;
      case 'trade':
        channel = 'trade';
        break;
      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }

    const subscription: Subscription = { instType, channel, instId };
    const key = this.getKey(subscription);

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    const subId = this.getId(subscription);
    this.subscriptions.get(key)?.add(subId);
    return subscription;
  }

  public remove(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): Subscription {
    const productType = safeProductType(exchangeType || 'spot');
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const instType = productType === 'spot' ? 'SP' : 'MC';
    const instId =
      productType === 'spot' ? formattedSymbol : `${formattedSymbol}_UMCBL`;

    let channel: string;
    switch (type) {
      case 'orderbook':
        channel = 'books';
        break;
      case 'kline':
        if (!timeframe) {
          throw new Error('Timeframe is required for kline subscription');
        }
        channel = `candle${toBitget(timeframe)}`;
        break;
      case 'trade':
        channel = 'trade';
        break;
      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }

    const subscription: Subscription = { instType, channel, instId };
    const key = this.getKey(subscription);
    if (this.subscriptions.has(key)) {
      const subId = this.getId(subscription);
      const set = this.subscriptions.get(key)!;
      set.delete(subId);
      if (set.size === 0) {
        this.subscriptions.delete(key);
      }
    }
    return subscription;
  }

  public getAll(): Subscription[] {
    const result: Subscription[] = [];
    const processed = new Set<string>();

    for (const subs of this.subscriptions.values()) {
      for (const subId of subs) {
        const [instType, channel, instId] = subId.split(':');
        const key = `${instType}:${channel}:${instId}`;
        if (!processed.has(key)) {
          processed.add(key);
          result.push({ instType, channel, instId });
        }
      }
    }
    return result;
  }

  private getKey(sub: Subscription): string {
    return `${sub.instType}:${sub.channel}:${sub.instId}`;
  }

  private getId(sub: Subscription): string {
    return `${sub.instType}:${sub.channel}:${sub.instId}`;
  }
}

export default SubscriptionManager;
