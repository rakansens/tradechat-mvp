import { SubscriptionManager } from '../../server/subscriptionManager';

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    manager = new SubscriptionManager();
  });

  it('サブスクリプションを追加できること', () => {
    const sub = manager.add('BTC/USDT', 'orderbook', undefined, 'spot');
    expect(manager.getAll()).toEqual([sub]);
  });

  it('サブスクリプションを削除できること', () => {
    manager.add('BTC/USDT', 'orderbook', undefined, 'spot');
    manager.remove('BTC/USDT', 'orderbook', undefined, 'spot');
    expect(manager.getAll()).toEqual([]);
  });
});
