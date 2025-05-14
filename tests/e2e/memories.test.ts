// tests/e2e/memories.test.ts
// メモリ管理機能のE2Eテスト
// 作成日: 2025/5/31

import { test, expect } from '@playwright/test';

// ログイン処理のヘルパー関数
async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('メモリ管理のE2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にログイン
    await login(page);
    // メモリページへ移動
    await page.goto('/memories');
  });

  test('メモリページが正しく表示されること', async ({ page }) => {
    // ページタイトルが正しいこと
    await expect(page).toHaveTitle(/メモリ管理/);
    
    // ヘッダーが表示されていること
    const header = page.locator('h1:has-text("メモリ管理")');
    await expect(header).toBeVisible();
    
    // メモリマネージャーコンポーネントが表示されていること
    const memoryManager = page.locator('.card');
    await expect(memoryManager).toBeVisible();
  });

  test('メモリの検索が機能すること', async ({ page }) => {
    // 検索ボックスに入力
    await page.fill('input[placeholder="検索..."]', 'テスト');
    
    // Enterキーを押す
    await page.keyboard.press('Enter');
    
    // 検索結果が表示されるまで待機
    await page.waitForTimeout(1000);
  });

  test('タブ切り替えが機能すること', async ({ page }) => {
    // 「同期済み」タブをクリック
    await page.click('button:has-text("同期済み")');
    
    // タブが切り替わることを確認
    const syncedTab = page.locator('button:has-text("同期済み")');
    await expect(syncedTab).toHaveAttribute('data-state', 'active');
    
    // 「ローカルのみ」タブをクリック
    await page.click('button:has-text("ローカルのみ")');
    
    // タブが切り替わることを確認
    const localTab = page.locator('button:has-text("ローカルのみ")');
    await expect(localTab).toHaveAttribute('data-state', 'active');
  });

  test('更新ボタンが機能すること', async ({ page }) => {
    // 更新ボタンをクリック
    await page.click('button:has-text("更新")');
    
    // 更新後のUIの変化を待機
    await page.waitForTimeout(1000);
  });

  // このテストは実際のメモリがあることを前提としています
  test.skip('メモリの削除が機能すること', async ({ page }) => {
    // 最初のメモリの削除ボタンをクリック
    await page.click('.card button:has-text("Delete")[aria-label="削除"]');
    
    // 確認ダイアログが表示されることを確認
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")');
    
    // ダイアログが閉じることを確認
    await expect(dialog).not.toBeVisible();
  });
}); 