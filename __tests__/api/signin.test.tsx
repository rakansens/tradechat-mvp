/**
 * サインインページのテスト
 * 作成日: 2025/6/15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignInPage from '@/app/(auth)/signin/page';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';

// モック
jest.mock('@/hooks/auth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('SignInPage', () => {
  const mockSignIn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false
    });
    
    // 成功レスポンスをデフォルト設定
    mockSignIn.mockResolvedValue({
      data: { session: { user: { id: 'test-id' } } },
      error: null
    });
  });
  
  it('フォームが正しくレンダリングされる', () => {
    render(<SignInPage />);
    
    expect(screen.getByText('トレードチャットにログイン')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByText('パスワードをお忘れですか？')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });
  
  it('入力フィールドが正しく動作する', () => {
    render(<SignInPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });
  
  it('フォーム送信時に正しくサインイン処理が実行される', async () => {
    render(<SignInPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // サインイン関数が呼ばれたことを確認
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // 成功トーストが表示されることを確認
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'ログイン成功'
      }));
    });
  });
  
  it('サインインエラー時にはエラートーストを表示する', async () => {
    // エラーをシミュレート
    mockSignIn.mockResolvedValue({
      data: null,
      error: new Error('無効な認証情報です')
    });
    
    render(<SignInPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);
    
    // エラートーストが表示されることを確認
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'ログインエラー',
        variant: 'destructive'
      }));
    });
  });
  
  it('送信中はログインボタンが無効化される', async () => {
    // サインイン処理を遅延させる
    mockSignIn.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: { session: { user: { id: 'test-id' } } },
          error: null
        });
      }, 100);
    }));
    
    render(<SignInPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // ボタンのテキストが変更されることを確認
    expect(screen.getByRole('button')).toHaveTextContent('ログイン中...');
    
    // 処理完了を待つ
    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });
}); 