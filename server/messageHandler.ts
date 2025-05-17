import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ExchangeType, ExchangeProductType } from '@/types/constants/enums';
import { logger } from '@/utils/common';
import { fromBitget } from '../utils/timeframe';
import { safeExchangeType } from '@/utils/exchangeTypeUtils';
import ConnectionManager from './connectionManager';

export class MessageHandler {
  constructor(private emitter: EventEmitter, private connection: ConnectionManager) {}

  public handle(data: WebSocket.Data): void {
    try {
      if (typeof data !== 'string') {
        logger.warn('Received non-string message from WebSocket', {
          component: 'MessageHandler',
          action: 'handle',
          dataType: typeof data
        });
        return;
      }

      if (data === 'ping') {
        this.connection.sendPong();
        return;
      }

      const message = JSON.parse(data);

      if (message.event) {
        this.handleEventMessage(message);
        return;
      }

      if (message.arg && message.data) {
        this.handleDataMessage(message);
        return;
      }

      logger.debug('Received unknown message format', {
        component: 'MessageHandler',
        action: 'handle',
        message
      });
    } catch (error) {
      logger.error('Error handling WebSocket message', error, {
        component: 'MessageHandler',
        action: 'handle'
      });
    }
  }

  private handleEventMessage(message: any): void {
    const { event, code, msg } = message;

    switch (event) {
      case 'subscribe':
        if (code === '0') {
          logger.info(`Successfully subscribed: ${JSON.stringify(message.arg)}`, {
            component: 'MessageHandler',
            action: 'handleEventMessage'
          });
        } else {
          logger.warn(`Subscription failed: ${msg}`, {
            component: 'MessageHandler',
            action: 'handleEventMessage',
            code,
            message
          });
        }
        break;

      case 'unsubscribe':
        if (code === '0') {
          logger.info(`Successfully unsubscribed: ${JSON.stringify(message.arg)}`, {
            component: 'MessageHandler',
            action: 'handleEventMessage'
          });
        } else {
          logger.warn(`Unsubscription failed: ${msg}`, {
            component: 'MessageHandler',
            action: 'handleEventMessage',
            code,
            message
          });
        }
        break;

      case 'error':
        logger.error(`WebSocket error event: ${msg}`, {
          component: 'MessageHandler',
          action: 'handleEventMessage',
          code,
          message
        });
        break;

      default:
        logger.debug(`Unknown event: ${event}`, {
          component: 'MessageHandler',
          action: 'handleEventMessage',
          message
        });
    }
  }

  private handleDataMessage(message: any): void {
    const { arg, data } = message;

    if (!arg || !arg.channel || !arg.instId) {
      logger.warn('Invalid data message format', {
        component: 'MessageHandler',
        action: 'handleDataMessage',
        message
      });
      return;
    }

    const { channel, instId, instType } = arg;
    const symbol = instId.replace('_UMCBL', '');
    const productType: ExchangeProductType = instType === 'SP' ? 'spot' : 'futures';
    const exchangeType = safeExchangeType(productType);

    let type: string;
    let timeframe: string | undefined;

    if (channel === 'books') {
      type = 'orderbook';
    } else if (channel === 'trade') {
      type = 'trade';
    } else if (channel.startsWith('candle')) {
      type = 'kline';
      timeframe = fromBitget(channel.replace('candle', ''));
    } else {
      logger.warn(`Unknown channel: ${channel}`, {
        component: 'MessageHandler',
        action: 'handleDataMessage'
      });
      return;
    }

    try {
      switch (type) {
        case 'orderbook':
          this.emitter.emit('orderbook', { symbol, exchangeType, data });
          break;
        case 'kline':
          this.emitter.emit('kline', { symbol, timeframe, exchangeType, data, channel });
          break;
        case 'trade':
          this.emitter.emit('trade', { symbol, exchangeType, data });
          break;
      }
    } catch (error) {
      logger.error(`Error emitting ${type} event`, error, {
        component: 'MessageHandler',
        action: 'handleDataMessage',
        type,
        symbol,
        exchangeType
      });
    }
  }
}

export default MessageHandler;
