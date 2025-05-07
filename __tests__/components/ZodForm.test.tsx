// __tests__/components/ZodForm.test.tsx
// 作成: ZodFormコンポーネントのテスト

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZodForm, FormValues } from '../../components/ui/ZodForm';

// モックのonSubmit関数
const mockOnSubmit = jest.fn();

describe('ZodFormコンポーネントのテスト', () => {
  beforeEach(() => {
    // 各テスト前にモック関数をリセット
    mockOnSubmit.mockClear();
  });

  test('フォームが正しくレンダリングされる', () => {
    render(<ZodForm onSubmit={mockOnSubmit} />);
    
    // 各フィールドが存在するか確認
    expect(screen.getByLabelText(/銘柄/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/価格/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/数量/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument();
  });

  test('デフォルト値が正しく設定される', () => {
    const defaultValues = {
      symbol: 'ETH-USDT',
      price: 3000,
      quantity: 1.5
    };
    
    render(<ZodForm onSubmit={mockOnSubmit} defaultValues={defaultValues} />);
    
    // デフォルト値が正しく設定されているか確認
    expect(screen.getByLabelText(/銘柄/i)).toHaveValue('ETH-USDT');
    expect(screen.getByLabelText(/価格/i)).toHaveValue('3000');
    expect(screen.getByLabelText(/数量/i)).toHaveValue('1.5');
  });

  test('有効なデータでフォームを送信できる', async () => {
    render(<ZodForm onSubmit={mockOnSubmit} />);
    
    // フォームに値を入力
    fireEvent.change(screen.getByLabelText(/銘柄/i), { target: { value: 'BTC-USDT' } });
    fireEvent.change(screen.getByLabelText(/価格/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/数量/i), { target: { value: '0.5' } });
    
    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: /送信/i }));
    
    // onSubmit関数が正しい値で呼び出されたか確認
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        symbol: 'BTC-USDT',
        price: 50000,
        quantity: 0.5
      });
    });
  });

  test('無効なデータでフォームを送信するとバリデーションエラーが表示される', async () => {
    render(<ZodForm onSubmit={mockOnSubmit} />);
    
    // 無効なデータを入力（銘柄を空に、価格と数量に負の値）
    fireEvent.change(screen.getByLabelText(/銘柄/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/価格/i), { target: { value: '-100' } });
    fireEvent.change(screen.getByLabelText(/数量/i), { target: { value: '-0.5' } });
    
    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: /送信/i }));
    
    // バリデーションエラーが表示されるか確認
    await waitFor(() => {
      expect(screen.getByText(/銘柄を入力してください/i)).toBeInTheDocument();
      expect(screen.getByText(/価格は正の数値を入力してください/i)).toBeInTheDocument();
      expect(screen.getByText(/数量は正の数値を入力してください/i)).toBeInTheDocument();
    });
    
    // onSubmit関数が呼び出されていないことを確認
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('数値型フィールドに文字列を入力するとバリデーションエラーが表示される', async () => {
    render(<ZodForm onSubmit={mockOnSubmit} />);
    
    // 銘柄に有効な値、価格と数量に文字列を入力
    fireEvent.change(screen.getByLabelText(/銘柄/i), { target: { value: 'BTC-USDT' } });
    fireEvent.change(screen.getByLabelText(/価格/i), { target: { value: 'not-a-number' } });
    fireEvent.change(screen.getByLabelText(/数量/i), { target: { value: 'invalid' } });
    
    // フォームを送信
    fireEvent.click(screen.getByRole('button', { name: /送信/i }));
    
    // バリデーションエラーが表示されるか確認
    await waitFor(() => {
      expect(screen.getByText(/価格は正の数値を入力してください/i)).toBeInTheDocument();
      expect(screen.getByText(/数量は正の数値を入力してください/i)).toBeInTheDocument();
    });
    
    // onSubmit関数が呼び出されていないことを確認
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});