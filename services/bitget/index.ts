/**
 * services/bitget/index.ts
 * BitgetApiClientとBitgetWebSocketClientをエクスポート
 * 
 * 更新: 2025-05-11 - BitgetWebSocketClientを追加
 * 更新: 2025-05-11 - BitgetWebSocketClientV2を追加
 */

import { BitgetApiClient } from '../bitgetApi';
import { BitgetWebSocketClient, getBitgetWebSocketClient } from './websocket';
import { BitgetWebSocketClient as BitgetWebSocketClientV2 } from './websocket-v2';

export { 
  BitgetApiClient, 
  BitgetWebSocketClient, 
  getBitgetWebSocketClient,
  BitgetWebSocketClientV2 
};
