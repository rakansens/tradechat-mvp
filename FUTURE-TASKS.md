# 将来的な追加タスク

## 優先度: 中

### プロフィール編集 UI での metadata 対応

- `components/profile/ProfileModal.tsx` を修正して metadata フィールドの編集をサポート
- UI でメタデータの特定フィールド（Twitter, 取引経験など）を個別に編集できるようにする
- 変更が `updateExtendedProfile` 関数を通じて保存されるよう連携

```tsx
// 実装例（ProfileModal.tsx 内）
const [twitterHandle, setTwitterHandle] = useState(profile?.metadata?.twitter_handle || '');
const [tradingExperience, setTradingExperience] = useState(profile?.metadata?.trading_experience || '');

// 保存処理
const handleSave = async () => {
  await updateExtendedProfile(user.id, {
    display_name: displayName,
    avatar_url: avatarUrl,
    bio,
    metadata: {
      twitter_handle: twitterHandle,
      trading_experience: tradingExperience,
      // 他のメタデータフィールド...
    }
  });
};
```

### RLS テストの Vitest での自動化

- `__tests__/security/rls.test.ts` を作成し、各ポリシーの動作を検証
- 認可されないアクセスが適切に拒否されるかテスト
- 特に重要なデータ（個人情報など）のアクセス制御を重点的に検証

```ts
// 実装例
describe('RLS ポリシーテスト', () => {
  it('未認証ユーザーはプロフィールを編集できない', async () => {
    const { error } = await anonClient
      .from('profiles')
      .update({ display_name: 'Test' })
      .eq('id', 'some-profile-id');
    
    expect(error).not.toBeNull();
    expect(error.code).toBe('42501'); // 権限エラー
  });
});
```

## 優先度: 低〜中

### metadata に対する JSON Schema バリデーション

#### App 層でのバリデーション

- Zod または Yup でスキーマを定義
- API エンドポイントでリクエストを検証

```ts
// 実装例
const profileMetadataSchema = z.object({
  twitter_handle: z.string().optional(),
  trading_experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  // 他のフィールド...
});

// API で使用
const { metadata } = req.body;
const result = profileMetadataSchema.safeParse(metadata);
if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

#### DB トリガーでのバリデーション

- PostgreSQL の CHECK 制約または BEFORE トリガーでバリデーション

```sql
-- 実装例
CREATE OR REPLACE FUNCTION validate_profile_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- JSONスキーマの検証
  IF NEW.metadata IS NOT NULL AND 
     (NEW.metadata->>'twitter_handle' IS NOT NULL AND length(NEW.metadata->>'twitter_handle') > 50) THEN
    RAISE EXCEPTION 'Twitter handle must be less than 50 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_metadata_validator
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_profile_metadata();
```

### メタデータの効率的なクエリのためのインデックス

将来的に metadata 内の特定キーでフィルタリングする頻度が高くなる場合に検討：

```sql
-- 実装例：GINインデックスの作成
CREATE INDEX idx_profiles_metadata ON profiles USING GIN (metadata);

-- または特定のキーに対する関数インデックス
CREATE INDEX idx_profiles_twitter_handle ON profiles ((metadata->>'twitter_handle'));
``` 