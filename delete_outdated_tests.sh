#!/bin/bash
# 古いテストファイルを削除

files_to_delete=(
  "__tests__/services/bitget/websocket.test.js"
  "__tests__/services/bitget/websocket-v2.test.ts"
  "__tests__/services/bitgetApi.test.ts"
  "__tests__/services/bitgetApi.orderbook.test.ts"
  "__tests__/websocket-ping-pong.test.ts"
  "__tests__/websocket-ping-unit.test.ts"
  "__tests__/api/websocket-client.test.ts"
  "__tests__/utils/socketClient.test.ts"
)

for file in "${files_to_delete[@]}"; do
  if [ -f "$file" ]; then
    echo "削除: $file"
    rm "$file"
  else
    echo "存在しないファイル: $file"
  fi
done

echo "古いテストファイルの削除が完了しました"
