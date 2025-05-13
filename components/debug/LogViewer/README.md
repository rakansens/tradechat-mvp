# LogViewer コンポーネント

LogViewerコンポーネントは、アプリケーションのデバッグ情報とログを表示するためのUI要素です。このコンポーネントは、以下の機能を提供します：

- ローカルストレージに保存されたログの表示とフィルタリング
- アクティブなAPIリクエストの監視
- ポーリング状態の表示
- シンボル変更履歴の追跡
- キャッシュ統計情報の表示

## アーキテクチャ

このコンポーネントは、モジュール性と保守性を向上させるために以下のように設計されています：

### ディレクトリ構造

```
components/debug/LogViewer/
├── LogViewer.tsx          # メインコンポーネント
├── index.ts               # バレルエクスポート
├── README.md              # ドキュメント
├── ui/                    # UIコンポーネント
│   ├── DebugModeSwitch.tsx    # デバッグモード切り替え
│   ├── LogsPanel.tsx          # ログ表示パネル
│   ├── FetchesPanel.tsx       # フェッチリクエスト表示
│   ├── PollingStatusPanel.tsx # ポーリング状態表示
│   ├── SymbolHistoryPanel.tsx # シンボル履歴表示
│   ├── CacheStatsPanel.tsx    # キャッシュ統計表示
│   └── __tests__/            # UIコンポーネントのテスト
└── __tests__/             # メインコンポーネントのテスト
```

### カスタムフック

UI部分とロジック部分を分離するために、以下のカスタムフックを使用しています：

- `useLogs`: ログのフィルタリングと管理を担当
- `useDebugStores`: 各種ストアへのアクセスとデバッグ情報の集約
- `useDebugPolling`: ポーリング処理の管理

これらのフックは `hooks/debug/` ディレクトリに配置されています。

## 使用方法

LogViewerコンポーネントは、デバッグモードが有効な場合にのみ表示されるよう設計されています。典型的な使用方法：

```tsx
import { LogViewer } from '@/components/debug';

function DebugPanel() {
  return (
    <div className="debug-panel">
      <LogViewer />
    </div>
  );
}
```

## 技術的詳細

### デバッグモード

デバッグモードは `useDebugStore` によって管理され、この状態によって以下の動作が変わります：

- デバッグ情報の自動更新（ポーリング）
- 詳細なログ情報の表示レベル

### ポーリング

デバッグ情報は `useDebugPolling` フックによって定期的に更新されます。デフォルトの更新間隔は2秒です。

### ログレベル

ログは以下のレベルでフィルタリングできます：

- `all`: すべてのログ
- `error`: エラーのみ
- `warn`: 警告のみ
- `debug`: デバッグ情報のみ

## テスト

各コンポーネントは単体テストによってカバーされています。テストを実行するには：

```bash
npm test components/debug
``` 