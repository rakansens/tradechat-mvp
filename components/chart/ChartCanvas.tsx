// components/chart/ChartCanvas.tsx
// 更新: 共通インターフェースを使用するように修正
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type {
  IChartApi,
  ISeriesApi,
  LineStyle,
  UTCTimestamp,
  // Core types
  Time,
  CandlestickData,
  LineData,
  BarData,
  WhitespaceData,
  SeriesMarker,
  // Options and Config types
  CandlestickSeriesOptions,
  DeepPartial,
} from "lightweight-charts"
// v5.0.6のAPIを使用するようにインポートを修正
import { createChart, ColorType } from "lightweight-charts";
import { CandlestickSeries, LineSeries, AreaSeries } from "lightweight-charts";
import type { Entry, ClosedEntry } from "@/types/entry"
import type { Timeframe, ChartType, OHLCData } from "@/types/chart"
import type { ChartViewProps, TimeframeControlProps, ChartTypeControlProps } from "@/types/common-interfaces"
import { theme } from "@/styles/colors"
import { useChartConfig } from "@/hooks/useChartConfig"
import { useTheme } from "next-themes"
import { RSI } from './indicators/rsi'; // Import RSI functions
import { logger } from '@/utils/logger'; // Import logger
import { MACD, MacdSeriesRefs } from "./indicators/macd"; // Import MACD functions
import {
  calculateIchimokuData,
  addOrUpdateIchimokuSeries,
  removeIchimokuSeries
} from "./indicators/ichimoku"; // Import Ichimoku functions
import {
  calculateFibonacciLevels,
  drawFibonacciRetracement,
  removeFibonacciRetracement,
  FibonacciLineHandles
} from "./drawing-tools/fibonacci"; // Import Fibonacci functions
import { RSI as RsiIndicator } from 'technicalindicators'; // Import directly for calculation
// 分割されたストアとセレクターをインポート
import { 
  useChartDataStore,
  useChartConfigStore,
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectHighPrice,
  selectLowPrice,
  selectRSI,
  selectMACD,
  selectSMA
} from "../../store";
// v5.0.6では既にColorTypeがインポートされているため、ここでは不要

// 共通インターフェースを使用して型定義を整理
interface ChartCanvasProps {
  data: OHLCData[]
  entries?: Entry[]
  timeframe: TimeframeControlProps["timeframe"]
  chartType: ChartType
}

// Helper function to convert HSL CSS variable string to RGBA
// Ensures it runs only on the client-side where document is available
const hslCssVarToRgba = (hslVarValue: string, fallbackColor: string): string => {
  if (typeof document === 'undefined' || !hslVarValue) {
    return fallbackColor; // Return fallback if not in browser or value is empty
  }
  try {
    const el = document.createElement('div');
    // IMPORTANT: Set style directly to hsl() format CSS expects
    el.style.color = `hsl(${hslVarValue})`;
    document.body.appendChild(el); // Needs to be in the DOM to compute style
    const rgbaColor = window.getComputedStyle(el).color;
    document.body.removeChild(el);

    // lightweight-charts accepts rgb/rgba strings
    if (rgbaColor && rgbaColor.startsWith('rgb')) {
      return rgbaColor;
    }
    logger.warn(`Failed to convert HSL value 'hsl(${hslVarValue})' to RGBA/RGB. Computed value: ${rgbaColor}. Using fallback: ${fallbackColor}`, {
      component: 'ChartCanvas',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor;
  } catch (error) {
    logger.error(`Error converting HSL value 'hsl(${hslVarValue})'`, error, {
      component: 'ChartCanvas',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor; // Return fallback on error
  }
};

// ResizeObserver用のdebounce関数
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

export default function ChartCanvas() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const areaSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // インジケーターのシリーズ参照
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeries = useRef<MacdSeriesRefs>({ 
    macdLine: { current: null },
    signalLine: { current: null },
    histogram: { current: null }
  });
  
  // 一目均衡表のシリーズ参照
  const tenkanSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const kijunSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const chikouSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const cloudSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // フィボナッチリトレースメントのライン参照
  const [fibonacciLines, setFibonacciLines] = useState<FibonacciLineHandles>({});
  
  // 分割されたチャートストアから状態を取得
  // データ関連の状態とアクション
  const { 
    data, 
    currentSymbol, 
    currentTimeFrame
  } = useChartDataStore();
  
  // 設定関連の状態
  const { 
    chartType 
  } = useChartConfigStore();
  
  // インジケーター関連の状態
  const { 
    activeIndicators 
  } = useIndicatorStore();
  
  // 描画ツール関連の状態
  const { 
    activeDrawingTools 
  } = useDrawingToolStore();

  // メモ化されたセレクターを使用して価格データを取得
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const highPrice = useChartDataStore(selectHighPrice);
  const lowPrice = useChartDataStore(selectLowPrice);
  
  // MACDデータを取得
  const macdData = useChartDataStore(selectMACD());
  
  // SMAデータを取得
  const sma20Data = useChartDataStore(selectSMA(20));
  const sma50Data = useChartDataStore(selectSMA(50));
  
  // RSIデータをトップレベルで取得
  const rsiValues = useChartDataStore(selectRSI(14));
  
  // Hook calls must be at component top-level; remove any nested calls in effects below.

  // チャートのリセット処理
  const resetChartState = () => {
    // インジケーターのシリーズをリセット
    rsiSeries.current = null;
    
    // MACDシリーズのリセット
    if (macdSeries.current) {
      macdSeries.current.macdLine.current = null;
      macdSeries.current.signalLine.current = null;
      macdSeries.current.histogram.current = null;
    }
  };

  // チャートの再描画処理
  const redrawChart = useCallback(() => {
    if (!chartRef.current || !chartInstanceRef.current) return;
    
    // チャートのサイズを再設定
    chartInstanceRef.current.resize(
      chartRef.current.clientWidth,
      chartRef.current.clientHeight
    );
    
    // Y軸の価格スケールを適切にフィットさせる
    if (candleSeries.current) {
      candleSeries.current.applyOptions({
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      
      // 必要に応じてフィッティング処理を実行
      chartInstanceRef.current.timeScale().fitContent();
    }
  }, []);

  // --- Pane management ---
  // Keeps track of next available pane index (0 is main chart)
  const paneCounterRef = useRef<number>(1);
  // Map indicator key -> assigned pane index
  const paneMapRef = useRef<Record<string, number>>({});
  // 直近のコンテナサイズを保持してResizeObserverループを防止
  const lastDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const getPaneIndex = (key: string): number => {
    if (paneMapRef.current[key] !== undefined) return paneMapRef.current[key];
    const idx = paneCounterRef.current++;
    paneMapRef.current[key] = idx;
    return idx;
  };

  // リサイズイベント検出用のResizeObserver
  useEffect(() => {
    if (!chartRef.current) return;
    
    // サイズ変更処理をdebounce
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      if (!chartInstanceRef.current || entries.length === 0) return;

      const entry = entries[0];
      const { width, height } = entry.contentRect;

      // 以前の寸法と比較して変更がある場合のみresizeを実行
      // 最小の変化（1px以上）がある場合のみresize実行（微小変化によるループを防止）
      if (
        Math.abs(width - lastDimensionsRef.current.width) > 1 ||
        Math.abs(height - lastDimensionsRef.current.height) > 1
      ) {
        lastDimensionsRef.current = { width, height };
        try {
          chartInstanceRef.current.resize(width, height);
        } catch (err) {
          logger.error('ResizeObserverによるchart.resize中にエラーが発生しました', err, {
            component: 'ChartCanvas',
            action: 'resizeObserver'
          });
        }
      }
    }, 100); // 100ms debounce
    
    // ResizeObserverを使用してコンテナリサイズを監視
    const resizeObserver = new ResizeObserver(handleResize);
    
    // 監視開始
    resizeObserver.observe(chartRef.current);
    
    // クリーンアップ
    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [redrawChart]);

  // Socket.IOイベントリスナーの設定
  useEffect(() => {
    // 時間足変更イベントのリスナー
    const handleTimeframeChange = (event: CustomEvent) => {
      const { timeframe } = event.detail;
      logger.info(`時間足変更イベントを受信: ${timeframe}`, {
        component: 'ChartCanvas',
        action: 'handleTimeframeChange'
      });
      
      // チャートデータストアの時間足を更新
      useChartDataStore.getState().updateTimeFrame(timeframe as Timeframe);
      
      // ツールバーの選択状態を更新するためのカスタムイベント
      const updateEvent = new CustomEvent('updateToolbarTimeframe', { detail: { timeframe } });
      window.dispatchEvent(updateEvent);
    };
    
    // 銘柄変更イベントのリスナー
    const handleSymbolChange = (event: CustomEvent) => {
      const { symbol } = event.detail;
      logger.info(`銘柄変更イベントを受信: ${symbol}`, {
        component: 'ChartCanvas',
        action: 'handleSymbolChange'
      });
      
      // チャートデータストアの銘柄を更新
      useChartDataStore.getState().updateSymbol(symbol);
      
      // ツールバーの選択状態を更新するためのカスタムイベント
      const updateEvent = new CustomEvent('updateToolbarSymbol', { detail: { symbol } });
      window.dispatchEvent(updateEvent);
    };
    
    // イベントリスナーを登録
    window.addEventListener('timeframeChanged', handleTimeframeChange as EventListener);
    window.addEventListener('symbolChanged', handleSymbolChange as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('timeframeChanged', handleTimeframeChange as EventListener);
      window.removeEventListener('symbolChanged', handleSymbolChange as EventListener);
    };
  }, []);

  // チャートの初期化と更新
  useEffect(() => {
    if (!chartRef.current) return;

    // チャートコンテナのサイズを取得
    const chartContainer = chartRef.current;
    const { width, height } = chartContainer.getBoundingClientRect();

    // チャートインスタンスの作成 - v5.0.6対応
    const chart = createChart(chartContainer, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#151924" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1F2937",
      },
      rightPriceScale: {
        borderColor: "#1F2937",
        scaleMargins: {
          top: 0.1, // 上部マージンを小さくして価格表示領域を拡大
          bottom: 0.1, // 下部マージンを小さくして価格表示領域を拡大
        },
        entireTextOnly: false, // 価格ラベルをクリッピングして表示
        visible: true,
        autoScale: true, // 自動スケーリングを有効化
      },
      crosshair: {
        mode: 0,
      },
    });

    // チャートシリーズの作成 - v5.0.6対応
    if (chartType === "candles") {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      candleSeries.current = chart.addSeries(CandlestickSeries, {
        upColor: "#26A69A",
        downColor: "#EF5350",
        borderVisible: false,
        wickUpColor: "#26A69A",
        wickDownColor: "#EF5350",
      });

      if (data && data.length > 0) {
        // データを検証して無効なデータポイントを除外
        const validData = data.filter(item => {
          // 時間値が有効であることを確認
          if (isNaN(item.time) || item.time <= 0) {
            logger.warn('初期化: 無効な時間値が見つかりました', {
              component: 'ChartCanvas',
              action: 'initChart',
              time: item.time
            });
            return false;
          }
          
          // 価格データが有効であることを確認
          if (isNaN(Number(item.open)) || isNaN(Number(item.high)) || 
              isNaN(Number(item.low)) || isNaN(Number(item.close))) {
            logger.warn('初期化: 無効な価格データが見つかりました', {
              component: 'ChartCanvas',
              action: 'initChart',
              time: item.time,
              data: item
            });
            return false;
          }
          
          return true;
        });
        
        // 有効なデータが少なすぎる場合は処理をスキップ
        if (validData.length < 2) {
          logger.warn('初期化: 有効なデータポイントが不足しています', {
            component: 'ChartCanvas',
            action: 'initChart',
            totalPoints: data.length,
            validPoints: validData.length
          });
        } else {
          // データを時間順（昇順）にソート
          const sortedData = [...validData].sort((a, b) => a.time - b.time);
          
          try {
            // データ形式を変換
            const formattedData = sortedData.map((item) => ({
              time: (item.time / 1000) as UTCTimestamp,
              open: Number(item.open),
              high: Number(item.high),
              low: Number(item.low),
              close: Number(item.close),
            }));
            
            // データが時間順に並んでいるか再確認
            let isDataValid = true;
            for (let i = 1; i < formattedData.length; i++) {
              if (formattedData[i].time <= formattedData[i-1].time) {
                isDataValid = false;
                logger.error('初期化: フォーマット後のデータが時間順になっていません', {
                  component: 'ChartCanvas',
                  action: 'initChart',
                  index: i,
                  prevTime: formattedData[i-1].time,
                  currentTime: formattedData[i].time
                });
                break;
              }
            }
            
            if (isDataValid) {
              logger.info(`初期化: 有効なデータをチャートに設定します (${formattedData.length}ポイント)`, {
                component: 'ChartCanvas',
                action: 'initChart'
              });
              candleSeries.current.setData(formattedData);
            } else {
              logger.error('初期化: データの時間順に問題があるため、チャートの更新をスキップします', {
                component: 'ChartCanvas',
                action: 'initChart'
              });
            }
          } catch (error) {
            logger.error('初期化: チャートデータの設定中にエラーが発生しました', {
              component: 'ChartCanvas',
              action: 'initChart',
              error
            });
          }
        }
      } else {
        logger.warn('初期化: データがないか空です', {
          component: 'ChartCanvas',
          action: 'initChart',
          dataLength: data?.length || 0
        });
      }
    } else if (chartType === "line" as ChartType) {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      lineSeries.current = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
      });

      if (data && data.length > 0) {
        // データを検証して無効なデータポイントを除外
        const validData = data.filter(item => {
          // 時間値が有効であることを確認
          if (isNaN(item.time) || item.time <= 0) return false;
          
          // 価格データが有効であることを確認（ラインチャートの場合はcloseのみ必要）
          if (isNaN(Number(item.close))) return false;
          
          return true;
        });
        
        if (validData.length >= 2) {
          // データを時間順（昇順）にソート
          const sortedData = [...validData].sort((a, b) => a.time - b.time);
          
          try {
            // データ形式を変換
            const formattedData = sortedData.map((item) => ({
              time: (item.time / 1000) as UTCTimestamp,
              value: Number(item.close),
            }));
            
            // データが時間順に並んでいるか確認
            let isDataValid = true;
            for (let i = 1; i < formattedData.length; i++) {
              if (formattedData[i].time <= formattedData[i-1].time) {
                isDataValid = false;
                break;
              }
            }
            
            if (isDataValid) {
              lineSeries.current.setData(formattedData);
            }
          } catch (error) {
            logger.error('初期化: ラインチャートデータの設定中にエラーが発生しました', {
              component: 'ChartCanvas',
              action: 'initChart',
              error
            });
          }
        }
      }
    } else if (chartType === "area" as ChartType) {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      areaSeries.current = chart.addSeries(AreaSeries, {
        topColor: "rgba(41, 98, 255, 0.56)",
        bottomColor: "rgba(41, 98, 255, 0.04)",
        lineColor: "rgba(41, 98, 255, 1)",
        lineWidth: 2,
      });

      if (data && data.length > 0) {
        // データを検証して無効なデータポイントを除外
        const validData = data.filter(item => {
          // 時間値が有効であることを確認
          if (isNaN(item.time) || item.time <= 0) return false;
          
          // 価格データが有効であることを確認（エリアチャートの場合はcloseのみ必要）
          if (isNaN(Number(item.close))) return false;
          
          return true;
        });
        
        if (validData.length >= 2) {
          // データを時間順（昇順）にソート
          const sortedData = [...validData].sort((a, b) => a.time - b.time);
          
          try {
            // データ形式を変換
            const formattedData = sortedData.map((item) => ({
              time: (item.time / 1000) as UTCTimestamp,
              value: Number(item.close),
            }));
            
            // データが時間順に並んでいるか確認
            let isDataValid = true;
            for (let i = 1; i < formattedData.length; i++) {
              if (formattedData[i].time <= formattedData[i-1].time) {
                isDataValid = false;
                break;
              }
            }
            
            if (isDataValid) {
              areaSeries.current.setData(formattedData);
            }
          } catch (error) {
            logger.error('初期化: エリアチャートデータの設定中にエラーが発生しました', {
              component: 'ChartCanvas',
              action: 'initChart',
              error
            });
          }
        }
      }
    }

    // チャートインスタンスを保存
    chartInstanceRef.current = chart;

    // クリーンアップ関数
    return () => {
      chart.remove();
      chartInstanceRef.current = null;
      candleSeries.current = null;
      lineSeries.current = null;
      areaSeries.current = null;
      // インジケーター / 補助シリーズもリセットして二重削除を防止
      // インジケーターのシリーズをリセット
      rsiSeries.current = null;
      
      // MACDシリーズのリセット
      if (macdSeries.current) {
        macdSeries.current.macdLine.current = null;
        macdSeries.current.signalLine.current = null;
        macdSeries.current.histogram.current = null;
      }
      if (tenkanSeries.current) tenkanSeries.current = null;
      if (kijunSeries.current) kijunSeries.current = null;
      if (chikouSeries.current) chikouSeries.current = null;
      if (cloudSeries.current) cloudSeries.current = null;
    };
  }, [chartType, currentTimeFrame]);

  // 時間値の処理を改善する関数
  function normalizeTimeValue(time: any): number {
    if (time === undefined || time === null) {
      logger.warn('時間値が未定義です。現在時刻を使用します', {
        component: 'ChartCanvas',
        action: 'normalizeTimeValue',
        data: { time: undefined }
      });
      return Date.now(); // 現在時刻をデフォルト値として使用
    }

    // 数値でない場合は変換を試みる
    if (typeof time !== 'number') {
      try {
        // 日付文字列の場合はDateオブジェクトに変換
        if (typeof time === 'string') {
          const date = new Date(time);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        }
        
        // その他の場合は数値に変換を試みる
        const numericTime = Number(time);
        if (!isNaN(numericTime) && numericTime > 0) {
          return numericTime;
        }
        
        // 数値変換に成功したが不正な値（0以下）の場合
        if (!isNaN(numericTime) && numericTime <= 0) {
          logger.warn('不正な時間値が検出されました。現在時刻を使用します', {
            component: 'ChartCanvas',
            action: 'normalizeTimeValue',
            time
          });
          return Date.now();
        }
      } catch (error) {
        logger.error('時間値の変換に失敗しました', {
          component: 'ChartCanvas',
          action: 'normalizeTimeValue',
          time,
          error
        });
      }
      
      // 変換に失敗した場合は現在時刻を使用
      return Date.now();
    }
    
    // 数値だが不正な値（0以下）の場合
    if (time <= 0) {
      logger.warn('不正な時間値が検出されました。現在時刻を使用します', {
        component: 'ChartCanvas',
        action: 'normalizeTimeValue',
        time
      });
      return Date.now();
    }
    
    // すでに数値の場合はそのまま返す
    return time;
  }

  // ミリ秒単位の時間値を確保する関数
  function ensureMilliseconds(time: number): number {
    // タイムスタンプが未定義または無効な場合
    if (time === undefined || time === null || isNaN(time) || time <= 0) {
      logger.warn('タイムスタンプが未定義または無効です', {
        component: 'ChartCanvas',
        action: 'ensureMilliseconds',
        time
      });
      return Date.now(); // 現在時刻を返す
    }
    
    // Unix秒の場合（桁数が少ない場合）はミリ秒に変換
    if (time < 10000000000) {
      return time * 1000;
    }
    return time;
  }

  // 重複する時間のデータを除去する関数
  function removeDuplicateTimeEntries(data: OHLCData[]): OHLCData[] {
    // 無効なデータを除外
    const validData = data.filter(item => {
      if (item == null || typeof item !== 'object') return false;
      
      // 時間値を標準化
      item.time = normalizeTimeValue(item.time);
      
      // ミリ秒単位であることを確保
      item.time = ensureMilliseconds(item.time);
      
      return true;
    });

    const timeMap = new Map<number, OHLCData>();
    
    // 各データポイントを時間でマップに格納（後のデータで上書き）
    validData.forEach(item => {
      timeMap.set(item.time, item);
    });
    
    // マップの値を配列に変換して返す
    return Array.from(timeMap.values());
  }

  // データの更新を監視
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    
    // データが空でないことを確認
    if (!data || data.length === 0) return;
    
    // データを時間順（昇順）にソートし、重複を除去
    const uniqueData = removeDuplicateTimeEntries(data);
    
    // NaN値をチェックして除外
    const validData = uniqueData.filter(item => {
      // 時間値が有効であることを確認
      if (isNaN(item.time) || item.time <= 0) {
        logger.warn('無効な時間値が見つかりました', {
          component: 'ChartCanvas',
          action: 'validateData',
          time: item.time
        });
        return false;
      }
      
      // 価格データが有効であることを確認
      if (isNaN(Number(item.open)) || isNaN(Number(item.high)) || 
          isNaN(Number(item.low)) || isNaN(Number(item.close))) {
        logger.warn('無効な価格データが見つかりました', {
          component: 'ChartCanvas',
          action: 'validateData',
          time: item.time,
          data: item
        });
        return false;
      }
      
      return true;
    });
    
    // 有効なデータが少なすぎる場合は処理をスキップ
    if (validData.length < 2) {
      logger.warn('有効なデータポイントが不足しています', {
        component: 'ChartCanvas',
        action: 'validateData',
        totalPoints: data.length,
        validPoints: validData.length
      });
      
      // デフォルトデータを生成（チャートを表示するため）
      if (validData.length === 0) {
        const defaultData = generateDefaultChartData();
        
        // チャートタイプに応じたデータフォーマットとシリーズ設定
        try {
          if (chartType === "candles" && candleSeries.current) {
            candleSeries.current.setData(defaultData.map(item => ({
              time: (item.time / 1000) as UTCTimestamp,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close
            })));
          } else if (chartType === "line" && lineSeries.current) {
            lineSeries.current.setData(defaultData.map(item => ({
              time: (item.time / 1000) as UTCTimestamp,
              value: item.close
            })));
          } else if (chartType === "area" && areaSeries.current) {
            areaSeries.current.setData(defaultData.map(item => ({
              time: (item.time / 1000) as UTCTimestamp,
              value: item.close
            })));
          }
        } catch (error) {
          logger.error('デフォルトチャートデータの設定中にエラーが発生しました', {
            component: 'ChartCanvas',
            action: 'setDefaultData',
            error
          });
        }
      }
      
      return;
    }
    
    // データを時間順（昇順）にソート
    const sortedData = [...validData].sort((a, b) => a.time - b.time);
    
    // データが時間順に並んでいるか検証（デバッグ用）
    let hasTimeOrderIssue = false;
    for (let i = 1; i < sortedData.length; i++) {
      if (sortedData[i].time < sortedData[i-1].time) {
        hasTimeOrderIssue = true;
        logger.warn('データが時間順になっていません', {
          component: 'ChartCanvas',
          action: 'renderChart',
          prevTime: sortedData[i-1].time,
          currentTime: sortedData[i].time,
          index: i
        });
        break;
      }
      
      // 同じ時間のデータがないことを確認
      if (sortedData[i].time === sortedData[i-1].time) {
        hasTimeOrderIssue = true;
        logger.warn('同じ時間のデータが複数存在します', {
          component: 'ChartCanvas',
          action: 'renderChart',
          time: sortedData[i].time,
          index: i
        });
        break;
      }
    }
    
    // 時間順の問題がある場合はログ出力
    if (hasTimeOrderIssue) {
      logger.warn('データの時間順に問題があります。データを修正します。', {
        component: 'ChartCanvas',
        action: 'renderChart',
        dataLength: data.length,
        uniqueDataLength: uniqueData.length,
        sortedDataLength: sortedData.length
      });
    }

    // データをセットする前に最終チェック
    try {
      if (chartType === "candles" && candleSeries.current) {
        const formattedData = sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        }));
        
        // データが時間順に並んでいるか再確認
        let isDataValid = true;
        for (let i = 1; i < formattedData.length; i++) {
          if (formattedData[i].time <= formattedData[i-1].time) {
            isDataValid = false;
            logger.error('フォーマット後のデータが時間順になっていません', {
              component: 'ChartCanvas',
              action: 'formatData',
              index: i,
              prevTime: formattedData[i-1].time,
              currentTime: formattedData[i].time
            });
            break;
          }
        }
        
        if (isDataValid) {
          candleSeries.current.setData(formattedData);
        } else {
          logger.error('データの時間順に問題があるため、チャートの更新をスキップします', {
            component: 'ChartCanvas',
            action: 'setData'
          });
        }
      } else if (chartType === "line" && lineSeries.current) {
        const formattedData = sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          value: Number(item.close),
        }));
        
        // データが時間順に並んでいるか再確認
        let isDataValid = true;
        for (let i = 1; i < formattedData.length; i++) {
          if (formattedData[i].time <= formattedData[i-1].time) {
            isDataValid = false;
            break;
          }
        }
        
        if (isDataValid) {
          lineSeries.current.setData(formattedData);
        }
      } else if (chartType === "area" && areaSeries.current) {
        const formattedData = sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          value: Number(item.close),
        }));
        
        // データが時間順に並んでいるか再確認
        let isDataValid = true;
        for (let i = 1; i < formattedData.length; i++) {
          if (formattedData[i].time <= formattedData[i-1].time) {
            isDataValid = false;
            break;
          }
        }
        
        if (isDataValid) {
          areaSeries.current.setData(formattedData);
        }
      }
    } catch (error) {
      logger.error('チャートデータの設定中にエラーが発生しました', {
        component: 'ChartCanvas',
        action: 'setData',
        error
      });
    }
  }, [data, chartType, currentTimeFrame]);

  // インジケーターの表示切替を監視
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    const chart = chartInstanceRef.current;
    const mainSeries = candleSeries.current || lineSeries.current || areaSeries.current;
    if (!mainSeries) return;
    
    // データを時間順（昇順）にソートし、重複を除去
    const uniqueData = removeDuplicateTimeEntries(data);
    const sortedData = [...uniqueData].sort((a, b) => a.time - b.time);
    
    // RSIインジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'rsi')) {
      // RSIパラメータを取得
      const activeRSI = activeIndicators.find(indicator => indicator.type === 'rsi');
      const rsiParams = {
        visible: true,
        period: activeRSI?.params?.period || 14,
        overbought: activeRSI?.params?.overbought || 70,
        oversold: activeRSI?.params?.oversold || 30,
        paneIndex: getPaneIndex('rsi')
      };
      
      // 新しいRSIインターフェースを使用
      RSI.addOrUpdate(chart, sortedData, rsiParams, rsiSeries);
    } else if (rsiSeries.current) {
      // RSIを非表示
      RSI.remove(chart, rsiSeries);
    }
    
    // MACDインジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'macd')) {
      // MACDパラメータを取得
      const activeMacd = activeIndicators.find(indicator => indicator.type === 'macd');
      const macdParams = {
        fastPeriod: activeMacd?.params?.fastPeriod || 12,
        slowPeriod: activeMacd?.params?.slowPeriod || 26,
        signalPeriod: activeMacd?.params?.signalPeriod || 9,
        paneIndex: getPaneIndex('macd'),
        visible: true
      };
      
      // データが十分にあるか確認
      if (sortedData.length >= Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod) {
        logger.info('MACDを表示します', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          dataPoints: sortedData.length
        });
        
        // MACDデータのサンプルをログ出力して確認
        // メモ化されたセレクターを使用してMACDを計算
        const macdSelector = selectMACD(macdParams.fastPeriod, macdParams.slowPeriod, macdParams.signalPeriod);
        const macdValues = macdSelector({ data: sortedData });
        
        logger.debug('MACDデータサンプル', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          macd: macdValues.macd.slice(-5),  // 最後の5データポイント
          signal: macdValues.signal.slice(-5),
          histogram: macdValues.histogram.slice(-5)
        });
        
        // 新しいMACDインターフェースを使用
        try {
          MACD.addOrUpdate(chart, sortedData, macdParams, macdSeries.current);
          logger.debug('MACD表示処理完了', {
            component: 'ChartCanvas',
            action: 'renderMACD'
          });
        } catch (error) {
          logger.error('MACD表示中にエラーが発生しました', error, {
            component: 'ChartCanvas',
            action: 'renderMACD',
            params: macdParams
          });
        }
      } else {
        logger.warn('MACDの計算に必要なデータが不足しています', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          dataPoints: sortedData.length,
          requiredPoints: Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod
        });
      }
    } else if (macdSeries.current) {
      // MACDを非表示
      MACD.remove(chart, macdSeries.current);
      // 保存済み paneMap は残しておく（再表示時に同じ pane を再利用）
    }
    
    // 一目均衡表インジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'ichimoku')) {
      // 一目均衡表パラメータを取得
      const activeIchimoku = activeIndicators.find(indicator => indicator.type === 'ichimoku');
      
      // 一目均衡表を表示
      addOrUpdateIchimokuSeries(
        chart,
        sortedData,
        {
          tenkan: activeIchimoku?.params?.tenkanPeriod || 9,
          kijun: activeIchimoku?.params?.kijunPeriod || 26,
          senkou: activeIchimoku?.params?.senkouSpanBPeriod || 52
        },
        {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        }
      );
    } else {
      // 一目均衡表を非表示
      if (tenkanSeries.current || kijunSeries.current || chikouSeries.current || cloudSeries.current) {
        removeIchimokuSeries(chart, {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        });
      }
    }
  }, [data, activeIndicators, chartType]);
  
  // 描画ツールの表示切替を監視
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    const chart = chartInstanceRef.current;
    const mainSeries = candleSeries.current || lineSeries.current || areaSeries.current;
    if (!mainSeries) return;
    
    // フィボナッチリトレースメントの表示切替
    if (activeDrawingTools.includes('fibonacci')) {
      // データから高値と安値を取得
      const uniqueData = removeDuplicateTimeEntries(data);
      const sortedData = [...uniqueData].sort((a, b) => a.time - b.time);
      const last30Data = sortedData.slice(-30); // 直近30本のデータを使用
      
      if (last30Data.length > 0) {
        const highPrice = Math.max(...last30Data.map(d => d.high));
        const lowPrice = Math.min(...last30Data.map(d => d.low));
        
        // 現在のトレンド方向を判断（簡易的な判断）
        const isDowntrend = sortedData[sortedData.length - 1].close < sortedData[sortedData.length - 10].close;
        
        // 既存のフィボナッチラインを削除
        if (Object.keys(fibonacciLines).length > 0) {
          removeFibonacciRetracement(mainSeries, fibonacciLines);
        }
        
        // 新しいフィボナッチラインを描画
        const newLines = drawFibonacciRetracement(
          chart,
          mainSeries,
          highPrice,
          lowPrice,
          isDowntrend ? 'down' : 'up'
        );
        
        setFibonacciLines(newLines);
      }
    } else {
      // フィボナッチを非表示
      if (Object.keys(fibonacciLines).length > 0) {
        removeFibonacciRetracement(mainSeries, fibonacciLines);
        setFibonacciLines({});
      }
    }
  }, [data, activeDrawingTools, chartType]);

  // デフォルトのチャートデータを生成する関数
  function generateDefaultChartData(): OHLCData[] {
    const now = Date.now();
    const data: OHLCData[] = [];
    
    // 現在から過去24時間分のデータを1時間ごとに生成
    for (let i = 24; i >= 0; i--) {
      const time = now - i * 3600 * 1000; // 1時間 = 3600秒 = 3600000ミリ秒
      const basePrice = 100 + Math.random() * 10; // 基本価格（ランダム要素あり）
      
      data.push({
        time,
        open: basePrice - 2 + Math.random() * 4,
        high: basePrice + 1 + Math.random() * 2,
        low: basePrice - 1 - Math.random() * 2,
        close: basePrice - 2 + Math.random() * 4,
      });
    }
    
    return data;
  }

  return (
    <div
      ref={chartRef}
      className="w-full h-full bg-dark-800"
      style={{ height: "100%" }}
    />
  );
}

// Get MA period based on timeframe
function getMAPeriodForTimeframe(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1d":
      return 50
    case "4h":
      return 50
    case "1h":
      return 48
    case "15m":
      return 48
    case "5m":
      return 50
    case "1m":
      return 50
    default:
      return 50
  }
}

// Create entry markers
function createEntryMarkers(entries: Entry[]): SeriesMarker<Time>[] {
  return entries.map((entry) => ({
    time: (new Date(entry.time).getTime() / 1000) as UTCTimestamp,
    position: entry.side === "buy" ? "belowBar" : "aboveBar",
    color: entry.side === "buy" ? theme.accent.green : theme.accent.red,
    shape: entry.side === "buy" ? "arrowUp" : "arrowDown",
    text: entry.side === "buy" ? "BUY" : "SELL",
    size: 2,
  }))
}

// 型ガード関数: entryがClosedEntry型かどうかをチェック
function isClosedEntry(entry: Entry): entry is ClosedEntry {
  return entry.status === "closed";
}

// Create exit markers
function createExitMarkers(entries: Entry[]): SeriesMarker<Time>[] {
  return entries
    .filter(isClosedEntry) // 型ガードを使用
    .map((entry) => ({
      time: (new Date(entry.exitTime).getTime() / 1000) as UTCTimestamp,
      position: entry.side === "buy" ? "aboveBar" : "belowBar",
      color: entry.profit > 0 ? theme.accent.green : theme.accent.red,
      shape: "circle",
      text: "EXIT",
      size: 2,
    }))
}
