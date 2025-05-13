/**
 * __tests__/components/symbol/SymbolList.test.tsx
 * SymbolListコンポーネントのテストスイート
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SymbolList } from '@/components/symbol/Selector/ui/SymbolList';
import { validateSymbolInfo } from '@/lib/validations/symbol';
import type { SymbolInfo } from '@/store/useSymbolStore';

// モックシンボルデータ
const mockSymbols: SymbolInfo[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFavorite: true },
];

// validateSymbolInfoのモック
jest.mock('@/lib/validations/symbol', () => ({
  validateSymbolInfo: jest.fn(),
}));

describe('SymbolList', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // validateSymbolInfoのモック実装
    (validateSymbolInfo as jest.Mock).mockReturnValue({
      success: true,
    });
  });
  
  test('読み込み中の状態が正しく表示される', () => {
    render(
      <SymbolList
        symbols={[]}
        isLoading={true}
        error={null}
        currentSymbol="BTCUSDT"
        onSelect={jest.fn()}
        onToggleFavorite={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // 読み込み中のテキストが表示されることを確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    
    // スケルトンローダーが表示されることを確認
    const skeletons = document.querySelectorAll('.h-10.w-full');
    expect(skeletons.length).toBe(8);
  });
  
  test('エラーが正しく表示され、再試行ボタンが機能する', () => {
    const mockRetry = jest.fn();
    
    render(
      <SymbolList
        symbols={[]}
        isLoading={false}
        error="データの取得に失敗しました"
        currentSymbol="BTCUSDT"
        onSelect={jest.fn()}
        onToggleFavorite={jest.fn()}
        onRetry={mockRetry}
      />
    );
    
    // エラーメッセージが表示されることを確認
    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    
    // 再試行ボタンをクリック
    fireEvent.click(screen.getByText('再試行'));
    
    // onRetryが呼ばれることを確認
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
  
  test('銘柄リストが空の場合に適切なメッセージが表示される', () => {
    render(
      <SymbolList
        symbols={[]}
        isLoading={false}
        error={null}
        currentSymbol="BTCUSDT"
        onSelect={jest.fn()}
        onToggleFavorite={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // 空リストのメッセージが表示されることを確認
    expect(screen.getByText('該当する銘柄がありません')).toBeInTheDocument();
  });
  
  test('銘柄リストが正しく表示され、クリックすると選択される', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <SymbolList
        symbols={mockSymbols}
        isLoading={false}
        error={null}
        currentSymbol="BTCUSDT"
        onSelect={mockOnSelect}
        onToggleFavorite={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // 各銘柄が表示されることを確認
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    
    // ETHの銘柄をクリック
    fireEvent.click(screen.getByText('ETH'));
    
    // onSelectが正しい引数で呼ばれることを確認
    expect(mockOnSelect).toHaveBeenCalledWith('ETHUSDT');
  });
  
  test('お気に入りアイコンをクリックするとトグルされる', () => {
    const mockToggleFavorite = jest.fn();
    
    render(
      <SymbolList
        symbols={mockSymbols}
        isLoading={false}
        error={null}
        currentSymbol="BTCUSDT"
        onSelect={jest.fn()}
        onToggleFavorite={mockToggleFavorite}
        onRetry={jest.fn()}
      />
    );
    
    // 全てのスターアイコン要素を取得
    const starIcons = document.querySelectorAll('.h-3\\.5.w-3\\.5');
    expect(starIcons.length).toBe(2);
    
    // 最初のアイコン（空のスター、BTC）をクリック
    fireEvent.click(starIcons[0]);
    
    // onToggleFavoriteが正しい引数で呼ばれることを確認
    expect(mockToggleFavorite).toHaveBeenCalledWith('BTCUSDT');
  });
  
  test('無効なシンボルデータがスキップされて、警告がログに出力される', () => {
    // コンソール警告のスパイ
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // validateSymbolInfoのモックを無効なシンボルに対して変更
    (validateSymbolInfo as jest.Mock)
      .mockImplementation((symbol) => {
        if (symbol.symbol === 'ETHUSDT') {
          return { success: false, error: 'Invalid symbol' };
        }
        return { success: true };
      });
    
    render(
      <SymbolList
        symbols={mockSymbols}
        isLoading={false}
        error={null}
        currentSymbol="BTCUSDT"
        onSelect={jest.fn()}
        onToggleFavorite={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    
    // BTCは表示されることを確認
    expect(screen.getByText('BTC')).toBeInTheDocument();
    
    // ETHは表示されないことを確認（無効なシンボル）
    expect(screen.queryByText('ETH')).not.toBeInTheDocument();
    
    // 無効なシンボルに対して警告が出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Symbol validation failed for ETHUSDT:',
      'Invalid symbol'
    );
  });
}); 