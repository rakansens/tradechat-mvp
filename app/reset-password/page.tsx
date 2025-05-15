/**
 * パスワードリセット完了ページ
 * 作成日: 2025/6/15
 */

import { Suspense } from 'react';
import ResetPasswordLoader from './ResetPasswordLoader';

export default function ResetPasswordPage() {
  // ここでメタデータやトークン検証など Server 処理が可能
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ResetPasswordLoader />
    </Suspense>
  );
} 