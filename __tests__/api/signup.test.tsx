// __tests__/api/signup.test.tsx
// サインアップページのテスト
// 作成日: 2025/6/15

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SignUpPage from '@/app/signup/page';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';

// モック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/auth/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('SignUpPage', () => {
  const mockSignUp = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // useAuth モックの設定
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });
    
    // useRouter モックの設定
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('サインアップフォームが正しくレンダリングされる', () => {
    render(<SignUpPage />);
    
    // 必要な要素が存在するか確認
    expect(screen.getByText('トレードチャットに新規登録')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アカウント作成' })).toBeInTheDocument();
    expect(screen.getByText(/既にアカウントをお持ちの場合は/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute('href', '/signin');
  });
  
  it('有効なフォーム送信でsignUp関数が呼ばれる', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
    
    render(<SignUpPage />);
    
    // フォーム入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'password123' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'アカウント作成' }));
    });
    
    // signUp関数が正しく呼ばれたか確認
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // 成功したらサインインページにリダイレクト
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });
  });
  
  it('パスワードが一致しない場合はエラーが表示される', async () => {
    render(<SignUpPage />);
    
    // フォーム入力（パスワードが一致しない）
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'password456' }, // 異なるパスワード
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'アカウント作成' }));
    });
    
    // signUp関数が呼ばれていないことを確認
    expect(mockSignUp).not.toHaveBeenCalled();
  });
  
  it('パスワードが短すぎる場合はエラーが表示される', async () => {
    render(<SignUpPage />);
    
    // フォーム入力（短いパスワード）
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'short' }, // 8文字未満
    });
    
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'short' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'アカウント作成' }));
    });
    
    // signUp関数が呼ばれていないことを確認
    expect(mockSignUp).not.toHaveBeenCalled();
  });
  
  it('signUpがエラーを返した場合はエラーメッセージが表示される', async () => {
    // エラーをモック
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'メールアドレスは既に使用されています' },
    });
    
    render(<SignUpPage />);
    
    // フォーム入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('パスワード（確認）'), {
      target: { value: 'password123' },
    });
    
    // フォーム送信
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'アカウント作成' }));
    });
    
    // signUp関数が呼ばれたことを確認
    expect(mockSignUp).toHaveBeenCalled();
    
    // リダイレクトされていないことを確認
    expect(mockPush).not.toHaveBeenCalled();
  });
}); 