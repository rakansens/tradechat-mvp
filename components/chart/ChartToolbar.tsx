import React from 'react';
import { useChartStore } from '@/store';
import { Wifi, WifiOff, TrendingUp, Landmark } from 'lucide-react';

interface ChartToolbarProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  chartType: string;
  onChartTypeChange: (type: string) => void;
}

const availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const availableSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT'];
const chartTypes = ['candles', 'line', 'area'];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  symbol,
  onSymbolChange,
  chartType,
  onChartTypeChange
}: ChartToolbarProps) {
  // リアルタイムデータの使用状態と切り替え関数を取得
  const useRealTimeData = useChartStore((state) => state.useRealTimeData);
  const toggleRealTimeData = useChartStore((state) => state.toggleRealTimeData);
  const error = useChartStore((state) => state.error);
  // 取引種別の状態と設定関数を取得
  const exchangeType = useChartStore((state) => state.exchangeType);
  const setExchangeType = useChartStore((state) => state.setExchangeType);

  return (
    <div className="flex flex-col w-full bg-dark-900 border-b border-gray-800">
      {/* エラーメッセージ表示エリア */}
      {error && (
        <div className="w-full px-4 py-1 bg-red-900/20 text-red-300 text-xs">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">
          {/* シンボル選択 */}
          <div className="flex items-center">
            <select
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              className="bg-dark-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
            >
              {availableSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          {/* タイムフレーム選択 */}
          <div className="flex items-center space-x-1">
            {availableTimeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 text-xs rounded ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
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

          {/* チャートタイプ選択 */}
          <div className="flex items-center space-x-1">
            {chartTypes.map((type) => (
              <button
                key={type}
                onClick={() => onChartTypeChange(type)}
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
        </div>
      </div>
    </div>
  );
} 