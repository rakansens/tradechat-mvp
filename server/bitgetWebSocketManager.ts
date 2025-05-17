import { EventEmitter } from 'events';
import { ExchangeType, ExchangeProductType } from '@/types/constants/enums';
import { logger } from '@/utils/common';
import ConnectionManager, { ConnectionState } from './connectionManager';
import SubscriptionManager, { Subscription } from './subscriptionManager';
import MessageHandler from './messageHandler';

export class BitgetWebSocketManager extends EventEmitter {
  private connection: ConnectionManager;
  private subscriptions: SubscriptionManager;
  private handler: MessageHandler;

  constructor(wsUrl?: string) {
    super();
    this.connection = new ConnectionManager({ wsUrl });
    this.subscriptions = new SubscriptionManager();
    this.handler = new MessageHandler(this, this.connection);

    this.connection.on('open', () => {
      this.subscriptions.getAll().forEach((sub) => {
        this.connection.send(JSON.stringify({ op: 'subscribe', args: [sub] }));
      });
      this.emit('connected');
    });

    this.connection.on('message', (data) => this.handler.handle(data));
    this.connection.on('error', (err) => this.emit('error', err));
    this.connection.on('close', (info) => this.emit('disconnected', info));
    this.connection.on('reconnect_failed', () => this.emit('reconnect_failed'));
  }

  public connect(): void {
    this.connection.connect();
  }

  public disconnect(): void {
    this.connection.disconnect();
  }

  public subscribe(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): boolean {
    try {
      const sub = this.subscriptions.add(symbol, type, timeframe, exchangeType);
      if (this.connection.isConnected()) {
        this.connection.send(JSON.stringify({ op: 'subscribe', args: [sub] }));
      }
      logger.info(`Subscribed to ${type} for ${symbol} (${exchangeType ?? 'spot'})`, {
        component: 'BitgetWebSocketManager',
        action: 'subscribe',
        subscription: sub
      });
      return true;
    } catch (error) {
      logger.error(`Failed to subscribe to ${type} for ${symbol}`, error, {
        component: 'BitgetWebSocketManager',
        action: 'subscribe'
      });
      return false;
    }
  }

  public unsubscribe(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): boolean {
    try {
      const sub = this.subscriptions.remove(symbol, type, timeframe, exchangeType);
      if (this.connection.isConnected()) {
        this.connection.send(JSON.stringify({ op: 'unsubscribe', args: [sub] }));
      }
      logger.info(`Unsubscribed from ${type} for ${symbol} (${exchangeType ?? 'spot'})`, {
        component: 'BitgetWebSocketManager',
        action: 'unsubscribe',
        subscription: sub
      });
      return true;
    } catch (error) {
      logger.error(`Failed to unsubscribe from ${type} for ${symbol}`, error, {
        component: 'BitgetWebSocketManager',
        action: 'unsubscribe'
      });
      return false;
    }
  }

  public getSubscriptions(): Subscription[] {
    return this.subscriptions.getAll();
  }

  public getConnectionState(): ConnectionState {
    return this.connection.getState();
  }

  public isConnected(): boolean {
    return this.connection.isConnected();
  }
}

export default BitgetWebSocketManager;
