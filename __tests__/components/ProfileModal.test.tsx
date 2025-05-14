/**
 * ProfileModalコンポーネントのテスト
 * 作成日: 2025/6/15
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { getProfile, updateProfile } from '@/lib/supabase/supabase-auth';
import { toast } from '@/components/ui/use-toast';

// モック
jest.mock('@/lib/supabase/supabase-auth', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn()
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

describe('ProfileModal', () => {
  const mockUserId = 'test-user-id';
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    (getProfile as jest.Mock).mockResolvedValue({
      id: 'profile-id',
      user_id: mockUserId,
      display_name: 'テストユーザー',
      avatar_url: 'https://example.com/avatar.png',
      bio: 'テスト用自己紹介',
      metadata: {
        twitter_handle: 'testuser',
        trading_experience: 'intermediate'
      }
    });
    
    (updateProfile as jest.Mock).mockResolvedValue({
      id: 'profile-id',
      user_id: mockUserId
    });
  });
  
  it('閉じている場合はnullをレンダリングする', () => {
    const { container } = render(
      <ProfileModal isOpen={false} onClose={mockOnClose} userId={mockUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('開いている場合はモーダルをレンダリングする', async () => {
    render(
      <ProfileModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );
    
    // ローディング表示を確認
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // プロフィールデータが読み込まれるのを待つ
    await waitFor(() => {
      expect(screen.getByText('プロフィール設定')).toBeInTheDocument();
    });
    
    // 各フィールドが正しい値で表示されていることを確認
    expect(screen.getByDisplayValue('テストユーザー')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト用自己紹介')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    
    // ドロップダウンが正しい値で選択されていることを確認
    const selectElement = screen.getByDisplayValue('中級者（1〜3年）');
    expect(selectElement).toBeInTheDocument();
  });
  
  it('フォーム入力が正しく動作する', async () => {
    render(
      <ProfileModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );
    
    // プロフィールデータが読み込まれるのを待つ
    await waitFor(() => {
      expect(screen.getByLabelText('表示名')).toBeInTheDocument();
    });
    
    // 表示名を変更
    const displayNameInput = screen.getByLabelText('表示名');
    fireEvent.change(displayNameInput, { target: { value: '新しい表示名' } });
    
    // 更新された値を確認
    expect(displayNameInput).toHaveValue('新しい表示名');
  });
  
  it('保存ボタンクリックで正しく保存処理が実行される', async () => {
    render(
      <ProfileModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );
    
    // プロフィールデータが読み込まれるのを待つ
    await waitFor(() => {
      expect(screen.getByText('プロフィールを保存')).toBeInTheDocument();
    });
    
    // 保存ボタンをクリック
    const saveButton = screen.getByText('プロフィールを保存');
    fireEvent.click(saveButton);
    
    // updateProfile関数が呼ばれたことを確認
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled();
    });
    
    // 成功トーストが表示されたことを確認
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'プロフィールを保存しました'
    }));
    
    // onClose関数が呼ばれたことを確認
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('キャンセルボタンクリックでモーダルが閉じる', async () => {
    render(
      <ProfileModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );
    
    // プロフィールデータが読み込まれるのを待つ
    await waitFor(() => {
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });
    
    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);
    
    // onClose関数が呼ばれたことを確認
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('プロフィール取得エラー時にはエラートーストを表示する', async () => {
    // エラーをシミュレート
    (getProfile as jest.Mock).mockRejectedValue(new Error('プロフィール取得エラー'));
    
    render(
      <ProfileModal isOpen={true} onClose={mockOnClose} userId={mockUserId} />
    );
    
    // エラートーストが表示されたことを確認
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'プロフィールの取得に失敗しました',
        variant: 'destructive'
      }));
    });
  });
}); 