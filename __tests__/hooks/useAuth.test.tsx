/**
 * useAuthフックのテスト
 * 作成日: 2025/6/15
 * 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/auth/useAuth';
import { createClient } from '@/lib/supabase/client';
import { getProfile, updateProfile } from '@/lib/supabase/features/auth';

// モック
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      })),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    }
  }))
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock('@/lib/supabase/features/auth', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn()
}));

const supabase = createClient();

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    (getProfile as jest.Mock).mockResolvedValue(null);
    (updateProfile as jest.Mock).mockResolvedValue({});
  });
  
  it('初期状態では認証なしの状態となる', async () => {
    const { result } = renderHook(() => useAuth());
    
    // フックの初期化には非同期処理が含まれるため、少し待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
  
  it('サインアップ関数が正しく動作する', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password');
      expect(response.data).toEqual({ user: mockUser });
      expect(response.error).toBeNull();
    });
    
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
  
  it('サインイン関数が正しく動作する', async () => {
    const mockSession = { user: { id: 'test-id' } };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password');
      expect(response.data).toEqual({ session: mockSession });
      expect(response.error).toBeNull();
    });
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });
  
  it('サインアウト関数が正しく動作する', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null
    });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
  
  it('パスワードリセット関数が正しく動作する', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null
    });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      const response = await result.current.resetPassword('test@example.com');
      expect(response.error).toBeNull();
    });
    
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalled();
  });
  
  it('認証エラーが正しく処理される', async () => {
    const mockError = new Error('認証エラー');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError
    });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrong-password');
      expect(response.data).toBeNull();
      expect(response.error).toEqual(mockError);
    });
  });
}); 