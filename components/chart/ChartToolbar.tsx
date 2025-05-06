// components/chart/ChartToolbar.tsx
// 更新: Homeコンポーネントのヘッダー機能を統合
"use client"

import React from 'react';
import { 
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  // その他のストア
  useUIStore, 
  useEntryStore 
} from '@/store';
import { Wifi, WifiOff, TrendingUp, Landmark, BarChart2, LineChart, Layers, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/styles/colors';
import { TabType, IndicatorType, DrawingToolType } from '@/types/store';
import { Timeframe, ChartType } from '@/types/chart';

interface ChartToolbarProps {
  // タブ関連のprops（親コンポーネントから渡される）
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const availableSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT'];
const chartTypes = ['candles', 'line', 'area'];

// 利用可能なインジケーターの定義
const indicators = [
  { id: 'rsi', name: 'RSI', icon: LineChart },
  { id: 'macd', name: 'MACD', icon: BarChart2 },
  { id: 'ichimoku', name: '一目均衡表', icon: Layers },
];

// 描画ツールの定義
const drawingTools = [
  { id: 'fibonacci', name: 'フィボナッチ', icon: TrendingUp },
  { id: 'rectangle', name: '矩形', icon: Landmark },
];

export default function ChartToolbar({
  activeTab = "chart",
  onTabChange
}: ChartToolbarProps) {
  // 分割されたチャートストアから状態とアクションを取得
  
  // チャートデータ関連
  const {
    currentSymbol,
    currentTimeFrame,
    error,
    updateTimeFrame,
    updateSymbol
  } = useChartDataStore();
  
  // メモ化されたセレクターを使用
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);
  
  // チャート設定関連
  const {
    chartType,
    exchangeType,
    setChartType,
    setExchangeType
  } = useChartConfigStore();
  
  // インジケーター関連
  const {
    activeIndicators,
    toggleIndicator,
    clearAllIndicators
  } = useIndicatorStore();
  
  // 描画ツール関連
  const {
    activeDrawingTools,
    toggleDrawingTool,
    clearAllDrawingTools
  } = useDrawingToolStore();
  
  // リアルタイム更新関連
  const {
    useRealTimeData,
    toggleRealTimeData
  } = useRealTimeStore();
  
  // ストアからのアクションはすべて取得済み
  
  // エントリーストアから状態を取得
  const entries = useEntryStore((state) => state.entries);
  const openPositionsCount = entries.filter((entry) => entry.status === "open").length;

  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: theme.background.card }}>
      {/* エラーメッセージ表示エリア */}
      {error && (
        <div className="w-full px-4 py-1 bg-red-900/20 text-red-300 text-xs">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center py-2 px-3 border-b" style={{ borderColor: theme.border.light, backgroundColor: theme.background.secondary }}>
        <div className="flex items-center space-x-2">
          {/* シンボル選択 */}
          <div className="flex items-center">
            <select
              value={currentSymbol}
              onChange={(e) => updateSymbol(e.target.value)}
              className="bg-transparent text-sm font-bold px-1 border-none focus:outline-none"
              style={{ color: theme.text.primary }}
            >
              {availableSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>
          
          <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light, color: theme.text.secondary }}>
            24h Vol: 12.5K
          </Badge>
          
          {/* 最新価格表示 - position:fixedで表示位置を固定 */}
          <div className="relative z-10 flex items-center">
            {currentPrice > 0 && (
              <Badge variant="outline" className="font-mono text-sm font-bold py-1 px-2 ml-2" style={{ 
                backgroundColor: theme.background.tertiary, 
                borderColor: theme.border.light, 
                color: theme.text.primary,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                ${currentPrice.toLocaleString('en-US')}
              </Badge>
            )}
            
            {/* 価格変化率表示 */}
            {priceChangePercent !== 0 && (
              <Badge variant="outline" className="font-mono text-sm font-bold py-1 px-2 ml-2" style={{ 
                backgroundColor: theme.background.tertiary, 
                borderColor: theme.border.light, 
                color: priceChangePercent >= 0 ? theme.accent.green : theme.accent.red,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* タイムフレーム選択 */}
          <div className="flex items-center space-x-1" role="group">
            {availableTimeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => updateTimeFrame(tf as Timeframe)}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent px-2 py-1 h-7 text-[#A7B0C4] data-[state=on]:bg-[#2962FF] data-[state=on]:text-white border-[#2A2E39] hover:bg-[#242838] ${
                  currentTimeFrame === tf ? 'bg-[#2962FF] text-white' : ''
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <Separator orientation="vertical" className="h-6 bg-[#374151]" />
          
          {/* チャート/ポジション切替タブ */}
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => onTabChange && onTabChange(value)} 
            className="h-7"
          >
            <TabsList className="h-7 bg-[#242838] border border-[#2A2E39]">
              <TabsTrigger 
                value="chart" 
                className="flex items-center h-6 px-2 text-xs data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Chart
              </TabsTrigger>
              <TabsTrigger 
                value="positions" 
                className="flex items-center relative h-6 px-2 text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#b2b5be]"
              >
                <LineChart className="h-3.5 w-3.5 mr-1" />
                Positions
                {openPositionsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-[#2196f3]">
                    {openPositionsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* 拡張ツールバー - チャートタイプ、インジケーター、取引種別など */}
      <div className="flex items-center justify-between px-4 py-1 border-b" style={{ borderColor: theme.border.light, backgroundColor: theme.background.tertiary }}>
        <div className="flex items-center space-x-4">
          {/* チャートタイプ選択 */}
          <div className="flex items-center space-x-1">
            {chartTypes.map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type as ChartType)}
                className={`px-3 py-1 text-xs rounded ${
                  chartType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          {/* インジケーター選択ポップオーバー */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center px-2 py-1 text-xs rounded bg-dark-800 text-gray-300 hover:bg-dark-700"
                title="インジケーター設定"
              >
                <LineChart className="w-3.5 h-3.5 mr-1" />
                <span>インジケーター</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-dark-800 border border-gray-700 text-white">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-300">インジケーター</h3>
                {indicators.map((indicator) => (
                  <div key={indicator.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`indicator-${indicator.id}`} 
                      checked={activeIndicators.includes(indicator.id as IndicatorType)}
                      onCheckedChange={() => toggleIndicator(indicator.id as IndicatorType)}
                    />
                    <Label 
                      htmlFor={`indicator-${indicator.id}`}
                      className="text-xs text-gray-300 cursor-pointer"
                    >
                      {indicator.name}
                    </Label>
                  </div>
                ))}
                
                <h3 className="text-xs font-semibold text-gray-300 pt-2">描画ツール</h3>
                {drawingTools.map((tool) => (
                  <div key={tool.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tool-${tool.id}`} 
                      checked={activeDrawingTools.includes(tool.id as DrawingToolType)}
                      onCheckedChange={() => toggleDrawingTool(tool.id as DrawingToolType)}
                    />
                    <Label 
                      htmlFor={`tool-${tool.id}`}
                      className="text-xs text-gray-300 cursor-pointer"
                    >
                      {tool.name}
                    </Label>
                  </div>
                ))}
                
                <div className="pt-2">
                  <button 
                    onClick={clearAllDrawingTools}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    すべての描画をクリア
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          {/* 取引種別切り替えボタン */}
          <div className="flex items-center">
            <button
              onClick={() => setExchangeType('spot')}
              className={`flex items-center px-2 py-1 text-xs rounded-l ${
                exchangeType === 'spot'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
              title="スポット取引"
            >
              <Landmark className="w-3 h-3 mr-1" />
              <span>SPOT</span>
            </button>
            <button
              onClick={() => setExchangeType('futures')}
              className={`flex items-center px-2 py-1 text-xs rounded-r ${
                exchangeType === 'futures'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
              title="先物取引"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>FUTURES</span>
            </button>
          </div>

          {/* リアルタイムデータ切り替えボタン */}
          <button
            onClick={toggleRealTimeData}
            className={`flex items-center px-2 py-1 text-xs rounded ${
              useRealTimeData
                ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
            title={useRealTimeData ? 'リアルタイムデータ使用中 (クリックで無効化)' : 'ダミーデータ使用中 (クリックでリアルタイムデータに切替)'}
          >
            {useRealTimeData ? (
              <>
                <Wifi className="w-3 h-3 mr-1" /> 
                <span>LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" /> 
                <span>DEMO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 