/**
 * services/bitget/index.ts
 * BitgetApiClientとBitgetWebSocketClientをエクスポート
 * 
 * 更新: 2025-05-11 - BitgetWebSocketClientを追加
 * 更新: 2025-05-11 - BitgetWebSocketClientV2を追加
 * 更新: 2025-05-12 - リファクタリング: services/api/bitgetへのリダイレクト
 * 
 * @deprecated このモジュールは非推奨です。代わりに services/api/bitget を使用してください。
 */

import { BitgetApiClient } from '../bitgetApi';
import { BitgetWebSocketClient as NewBitgetWebSocketClient } from '../api/bitget/websocket-client';
import { BitgetRestClient } from '../api/bitget/rest-client';
import { logger } from '../../utils/logger';

// 元のWebSocketクライアントをエミュレート
class BitgetWebSocketClient extends NewBitgetWebSocketClient {
  constructor(exchangeType: string = 'spot') {
    super();
    logger.warn('BitgetWebSocketClient is deprecated. Use services/api/bitget/websocket-client instead.', {
      component: 'BitgetWebSocketClient',
      deprecated: true
    });
  }
}

// V2クライアントをエミュレート
const BitgetWebSocketClientV2 = NewBitgetWebSocketClient;

// シングルトンインスタンス取得関数
function getBitgetWebSocketClient(exchangeType: string = 'spot') {
  logger.warn('getBitgetWebSocketClient is deprecated. Use DataSourceFactory instead.', {
    component: 'getBitgetWebSocketClient',
    deprecated: true
  });
  return new BitgetWebSocketClient(exchangeType);
}

export { 
  BitgetApiClient, 
  BitgetWebSocketClient, 
  getBitgetWebSocketClient,
  BitgetWebSocketClientV2 
};
