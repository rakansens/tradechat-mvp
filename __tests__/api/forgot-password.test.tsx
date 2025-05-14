// __tests__/api/forgot-password.test.tsx
// パスワードリセットページのテスト
// 作成日: 2025/6/15

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ForgotPasswordPage from '@/app/forgot-password/page';
import { useAuth } from '@/hooks/auth/useAuth';

// モック
jest.mock('@/hooks/auth/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('ForgotPasswordPage', () => {
  const mockResetPassword = jest.fn();
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // useAuth モックの設定
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
    });
  });
  
  it('パスワードリセットフォームが正しくレンダリングされる', () => {
    render(<ForgotPasswordPage />);
    
    // 必要な要素が存在するか確認
    expect(screen.getByText('パスワードをリセット')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リセットリンクを送信' })).toBeInTheDocument();
    expect(screen.getByText('ログインページに戻る')).toBeInTheDocument();
  });
  
  it('有効なメールアドレスで送信するとresetPassword関数が呼ばれる', async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    
    render(<ForgotPasswordPage />);
    
    // メールアドレス入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));
    });
    
    // resetPassword関数が正しく呼ばれたか確認
    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    
    // 送信後のメッセージが表示されるか確認
    await waitFor(() => {
      expect(screen.getByText('パスワードリセット用のメールを送信しました。')).toBeInTheDocument();
    });
  });
  
  it('resetPasswordがエラーを返した場合はエラーメッセージが表示される', async () => {
    // エラーをモック
    mockResetPassword.mockResolvedValue({
      error: { message: 'そのメールアドレスは登録されていません' },
    });
    
    render(<ForgotPasswordPage />);
    
    // メールアドレス入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'unknown@example.com' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));
    });
    
    // resetPassword関数が呼ばれたことを確認
    expect(mockResetPassword).toHaveBeenCalled();
    
    // 送信成功メッセージが表示されないことを確認
    expect(screen.queryByText('パスワードリセット用のメールを送信しました。')).not.toBeInTheDocument();
  });
}); 