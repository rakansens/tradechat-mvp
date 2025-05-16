// store/index.ts
// 更新: 全てのストアをstoreディレクトリからエクスポート
// 更新: 2025-10-02 - フラット構造に変更し、ルートストアを単一のファイルから再エクスポート
// 更新: 2025-10-10 - 重要な型定義を追加エクスポート（DrawingToolType、IndicatorType、TabType、ActiveIndicator）
// 更新: 2025-10-10 - インポートパスを実際のファイル構造に合わせて修正

// root store
export { useRootStore, type RootState, type RootActions, type RootStore, type Selector } from './rootStore'

// ストアのスライス型をエクスポート
// 実際のファイル構造に合わせて定義
// 一部のスライスには専用のtypes.tsがあり、一部のスライスはindex.tsで型をエクスポートしている
export type { ChartSlice } from './chart'
export type { ChatSlice } from './chat'
export type { EntrySlice } from './entry'
export type { MarketSlice } from './market'
export type { UISlice } from './ui'
export type { SymbolSlice } from './symbol'
export type { SocketSlice } from './socket'
export type { ChartDataSlice } from './chart/data/types'
export type { DrawingToolSlice } from './chart/drawingTool/types'
export type { ChartConfigSlice } from './chart/config/types'
export type { IndicatorSlice } from './chart/indicator/types'
export type { RealTimeSlice } from './chart/realTime/types'
export type { DebugSlice } from './debug'
export type { DataFetchSlice } from './dataFetch'
export type { SettingsSlice } from './settings/types'

// ストアの状態型をエクスポート
export type { ChartSliceState } from './chart/state'
export type { ChatSliceState } from './chat/state'
export type { EntrySliceState } from './entry/state'
export type { MarketSliceState } from './market/state'
export type { UISliceState } from './ui/state'
export type { SymbolSliceState } from './symbol/state'
export type { SocketSliceState } from './socket/state'
export type { ChartDataSliceState } from './chart/data/types'
export type { DrawingToolSliceState } from './chart/drawingTool/types'
export type { ChartConfigSliceState } from './chart/config/types' 
export type { IndicatorSliceState } from './chart/indicator/types'
export type { RealTimeSliceState } from './chart/realTime/types'
export type { DebugSliceState } from './debug/state'
export type { DataFetchSliceState } from './dataFetch/state'
export type { SettingsState } from './settings/types'

// 重要な型定義
// DrawingToolType, IndicatorType, TabType, ActiveIndicator型をtype/storeからエクスポート
export type { DrawingToolType, IndicatorType, ActiveIndicator } from '@/types/store/chart'
export type { TabType } from '@/types/store/ui'

// createStorers
export { createUISlice } from './ui'
export { createChatSlice } from './chat'
export { createChartSlice } from './chart'
export { createEntrySlice } from './entry'
export { createMarketSlice } from './market'
export { createSymbolSlice } from './symbol'
export { createSocketSlice } from './socket'
export { createChartDataSlice } from './chart/data'
export { createDrawingToolSlice } from './chart/drawingTool'
export { createChartConfigSlice } from './chart/config'
export { createIndicatorSlice } from './chart/indicator'
export { createRealTimeSlice } from './chart/realTime'
export { createDebugSlice } from './debug'
export { createDataFetchSlice } from './dataFetch'
export { createSettingsSlice } from './settings'

// セレクター
export * from './selectors'

// ストアの中だけで使う内部ヘルパー（他のストアコードから必要とされる場合）
export { createImmerSetter, createImmerSetterWithReturn } from './core/immerSet'
