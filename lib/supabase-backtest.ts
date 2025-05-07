// lib/supabase-backtest.ts
// Supabaseバックテストデータ関連ユーティリティ関数
// 作成日: 2025/5/7

import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type BacktestData = Database['public']['Tables']['backtest_data']['Row'];

/**
 * バックテストデータ一覧を取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns バックテストデータ一覧
 */
export const getBacktestDataList = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<BacktestData[]> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * シンボルでバックテストデータを検索
 * @param userId ユーザーID
 * @param symbol シンボル
 * @param limit 取得件数
 * @param offset オフセット
 * @returns バックテストデータ一覧
 */
export const getBacktestDataBySymbol = async (
  userId: string,
  symbol: string,
  limit = 50,
  offset = 0
): Promise<BacktestData[]> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * バックテストデータを取得
 * @param backtestId バックテストID
 * @returns バックテストデータ
 */
export const getBacktestData = async (
  backtestId: string
): Promise<BacktestData> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .select('*')
    .eq('id', backtestId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * バックテストデータを作成
 * @param userId ユーザーID
 * @param name バックテスト名
 * @param symbol シンボル
 * @param timeframe タイムフレーム
 * @param startDate 開始日時
 * @param endDate 終了日時
 * @param strategy 戦略
 * @param results 結果
 * @returns 作成されたバックテストデータ
 */
export const createBacktestData = async (
  userId: string,
  name: string,
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date,
  strategy: Record<string, any>,
  results: Record<string, any>
): Promise<BacktestData> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .insert([
      {
        user_id: userId,
        name,
        symbol,
        timeframe,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        strategy,
        results,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * バックテストデータを更新
 * @param backtestId バックテストID
 * @param updates 更新内容
 * @returns 更新されたバックテストデータ
 */
export const updateBacktestData = async (
  backtestId: string,
  updates: Partial<Omit<BacktestData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<BacktestData> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .update(updates)
    .eq('id', backtestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * バックテストデータを削除
 * @param backtestId バックテストID
 * @returns 削除結果
 */
export const deleteBacktestData = async (
  backtestId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('backtest_data')
    .delete()
    .eq('id', backtestId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * バックテスト結果を比較
 * @param backtestIds バックテストID配列
 * @returns バックテストデータ配列
 */
export const compareBacktestResults = async (
  backtestIds: string[]
): Promise<BacktestData[]> => {
  if (backtestIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('backtest_data')
    .select('*')
    .in('id', backtestIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * 同じシンボルとタイムフレームのバックテストデータを検索
 * @param userId ユーザーID
 * @param symbol シンボル
 * @param timeframe タイムフレーム
 * @param limit 取得件数
 * @returns バックテストデータ一覧
 */
export const findSimilarBacktests = async (
  userId: string,
  symbol: string,
  timeframe: string,
  limit = 5
): Promise<BacktestData[]> => {
  const { data, error } = await supabase
    .from('backtest_data')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * バックテスト結果の統計情報を計算
 * @param backtestData バックテストデータ
 * @returns 統計情報
 */
export const calculateBacktestStats = (
  backtestData: BacktestData
): Record<string, any> => {
  const results = backtestData.results as Record<string, any>;
  
  // 結果がない場合は空のオブジェクトを返す
  if (!results || !results.trades || !Array.isArray(results.trades)) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageProfit: 0,
      maxDrawdown: 0,
    };
  }

  const trades = results.trades as Array<Record<string, any>>;
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.profit > 0).length;
  const losingTrades = trades.filter(trade => trade.profit < 0).length;
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit > 0 ? trade.profit : 0), 0);
  const totalLoss = Math.abs(trades.reduce((sum, trade) => sum + (trade.profit < 0 ? trade.profit : 0), 0));
  
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const averageProfit = totalTrades > 0 ? trades.reduce((sum, trade) => sum + trade.profit, 0) / totalTrades : 0;
  
  // 最大ドローダウンの計算
  let maxDrawdown = 0;
  let peak = 0;
  let balance = 0;
  
  trades.forEach(trade => {
    balance += trade.profit;
    if (balance > peak) {
      peak = balance;
    }
    const drawdown = peak - balance;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    averageProfit,
    maxDrawdown,
    totalProfit: totalProfit + totalLoss,
    netProfit: totalProfit - totalLoss,
  };
};