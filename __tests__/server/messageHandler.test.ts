import { EventEmitter } from 'events';
import MessageHandler from '../../server/messageHandler';
import { logger } from '../../utils/common';

jest.mock('../../utils/common', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('MessageHandler', () => {
  let emitter: EventEmitter;
  let connection: any;
  let handler: MessageHandler;

  beforeEach(() => {
    emitter = new EventEmitter();
    connection = { sendPong: jest.fn() };
    handler = new MessageHandler(emitter, connection);
  });

  it('pingメッセージに応答すること', () => {
    handler.handle('ping');
    expect(connection.sendPong).toHaveBeenCalled();
  });

  it('orderbookイベントを発行できること', () => {
    const spy = jest.fn();
    emitter.on('orderbook', spy);
    const msg = JSON.stringify({
      arg: { channel: 'books', instId: 'BTCUSDT', instType: 'SP' },
      data: {}
    });
    handler.handle(msg);
    expect(spy).toHaveBeenCalled();
  });
});
