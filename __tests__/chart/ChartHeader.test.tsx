/**
 * __tests__/chart/ChartHeader.test.tsx
 * チャートセクションのヘッダーコンポーネントのテスト
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSectionのリファクタリングに伴い作成
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChartHeader } from '@/components/chart/sections/ChartSection/ChartHeader';

describe('ChartHeader', () => {
  test('マウント前（SSR時）には値を表示しない', () => {
    const { container, queryByText } = render(
      <ChartHeader
        currentSymbol="BTCUSDT"
        currentPrice={50000.25}
        priceChangePercent={5.5}
        formattedDateRange="2023-06-01 - 2023-06-04"
        mounted={false}
      />
    );
    
    // シンボル名が表示されないことを確認
    expect(queryByText('BTCUSDT')).toBeNull();
    // 価格が表示されないことを確認
    expect(queryByText('$50,000.25')).toBeNull();
    // 価格変化率が表示されないことを確認
    expect(queryByText('+5.50%')).toBeNull();
    // 日付範囲が表示されないことを確認
    expect(queryByText('2023-06-01 - 2023-06-04')).toBeNull();
    
    // スナップショットテスト
    expect(container).toMatchSnapshot();
  });

  test('マウント後（クライアントサイド）に正しく値を表示する', () => {
    const { container, getByText } = render(
      <ChartHeader
        currentSymbol="BTCUSDT"
        currentPrice={50000.25}
        priceChangePercent={5.5}
        formattedDateRange="2023-06-01 - 2023-06-04"
        mounted={true}
      />
    );
    
    // シンボル名が表示されることを確認
    expect(getByText('BTCUSDT')).toBeInTheDocument();
    // 価格が表示されることを確認（$とカンマを含む形式）
    expect(getByText('$50,000.25')).toBeInTheDocument();
    // 価格変化率が表示されることを確認（+符号と%を含む形式）
    expect(getByText('+5.50%')).toBeInTheDocument();
    // 日付範囲が表示されることを確認
    expect(getByText('2023-06-01 - 2023-06-04')).toBeInTheDocument();
    
    // スナップショットテスト
    expect(container).toMatchSnapshot();
  });

  test('価格変化率がマイナスの場合に正しく表示する', () => {
    const { container, getByText } = render(
      <ChartHeader
        currentSymbol="BTCUSDT"
        currentPrice={48000.75}
        priceChangePercent={-2.5}
        formattedDateRange="2023-06-01 - 2023-06-04"
        mounted={true}
      />
    );
    
    // 価格変化率がマイナス符号付きで表示されることを確認
    expect(getByText('-2.50%')).toBeInTheDocument();
    
    // スナップショットテスト
    expect(container).toMatchSnapshot();
  });
}); 