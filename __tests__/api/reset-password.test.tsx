// __tests__/api/reset-password.test.tsx
// パスワードリセット完了ページのテスト
// 作成日: 2025/6/15

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/reset-password/page';
import { supabase } from '@/lib/supabase/supabase';

// モック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/supabase/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

describe('ResetPasswordPage', () => {
  const mockUpdateUser = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
  };
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // useSearchParams モックの設定
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // supabase.auth.updateUser モックの設定
    supabase.auth.updateUser = mockUpdateUser;
  });
  
  it('トークンがない場合はエラーメッセージが表示される', () => {
    // トークンが存在しない場合
    mockSearchParams.get.mockReturnValue(null);
    
    render(<ResetPasswordPage />);
    
    // エラーメッセージが表示されるか確認
    expect(screen.getByText('無効なリセットリンクです。再度パスワードリセットを行ってください。')).toBeInTheDocument();
    expect(screen.getByText('パスワードリセットをやり直す')).toBeInTheDocument();
  });
  
  it('トークンがある場合はパスワードリセットフォームが表示される', () => {
    // トークンが存在する場合
    mockSearchParams.get.mockReturnValue('valid-token');
    
    render(<ResetPasswordPage />);
    
    // フォームが表示されるか確認
    expect(screen.getByText('パスワードリセット')).toBeInTheDocument();
    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('新しいパスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'パスワードを更新' })).toBeInTheDocument();
  });
  
  it('パスワードが一致しない場合はエラーが表示される', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    
    render(<ResetPasswordPage />);
    
    // パスワード入力（一致しない）
    fireEvent.change(screen.getByLabelText('新しいパスワード'), {
      target: { value: 'newpassword123' },
    });
    
    fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
      target: { value: 'differentpassword' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'パスワードを更新' }));
    });
    
    // updateUser関数が呼ばれていないことを確認
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
  
  it('パスワードが短すぎる場合はエラーが表示される', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    
    render(<ResetPasswordPage />);
    
    // 短いパスワード入力
    fireEvent.change(screen.getByLabelText('新しいパスワード'), {
      target: { value: 'short' },
    });
    
    fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
      target: { value: 'short' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'パスワードを更新' }));
    });
    
    // updateUser関数が呼ばれていないことを確認
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
  
  it('有効なパスワードで送信するとupdateUser関数が呼ばれる', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    mockUpdateUser.mockResolvedValue({ error: null });
    
    render(<ResetPasswordPage />);
    
    // パスワード入力
    fireEvent.change(screen.getByLabelText('新しいパスワード'), {
      target: { value: 'newpassword123' },
    });
    
    fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
      target: { value: 'newpassword123' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'パスワードを更新' }));
    });
    
    // updateUser関数が正しく呼ばれたか確認
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newpassword123'
    });
    
    // 成功メッセージが表示されるか確認
    await waitFor(() => {
      expect(screen.getByText('パスワードが正常に更新されました。')).toBeInTheDocument();
    });
  });
  
  it('updateUserがエラーを返した場合はエラーメッセージが表示される', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    mockUpdateUser.mockResolvedValue({
      error: { message: 'トークンが無効です' }
    });
    
    render(<ResetPasswordPage />);
    
    // パスワード入力
    fireEvent.change(screen.getByLabelText('新しいパスワード'), {
      target: { value: 'newpassword123' },
    });
    
    fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
      target: { value: 'newpassword123' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'パスワードを更新' }));
    });
    
    // updateUser関数が呼ばれたことを確認
    expect(mockUpdateUser).toHaveBeenCalled();
    
    // 成功メッセージが表示されないことを確認
    expect(screen.queryByText('パスワードが正常に更新されました。')).not.toBeInTheDocument();
  });
}); 