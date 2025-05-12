/**
 * services/bitget/index.ts
 * BitgetApiClientとBitgetWebSocketClientをエクスポート
 * 
 * 更新: 2025-05-12 - リファクタリング完了: 古い実装を削除し、完全に新しい実装へリダイレクト
 * 
 * @deprecated このモジュールは非推奨です。代わりに services/api/bitget を使用してください。
 */

import { BitgetRestClient } from '../api/bitget/rest-client';
import { BitgetWebSocketClient as NewBitgetWebSocketClient } from '../api/bitget/websocket-client';
import { logger } from '../../utils/logger';

// BitgetApiClientのエクスポート
import { BitgetApiClient } from '../bitgetApi';

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
