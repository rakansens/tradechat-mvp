// app/reset-password/ResetPasswordLoader.tsx
// <!-- このファイルは ResetPasswordClient を ssr:false で動的に読み込みます。 -->
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// ssr:false で動的読み込み
const ResetPasswordClient = dynamic(() => import('./ResetPasswordClient'), {
  ssr: false,
});

export default function ResetPasswordLoader() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
} 