import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Skip all tests when credentials are missing
const shouldSkip = !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY;

const anonClient = shouldSkip ? null : createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
const serviceClient = shouldSkip ? null : createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function createAuthedClient(email: string, password: string): Promise<{ client: SupabaseClient, userId: string }> {
  if (!anonClient) throw new Error('Anon client not initialised');
  // sign in
  const signInRes = await anonClient.auth.signInWithPassword({ email, password });
  if (signInRes.error || !signInRes.data.session) {
    throw new Error(`Failed to sign in: ${signInRes.error?.message}`);
  }
  const token = signInRes.data.session.access_token;
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  return { client: authed, userId: signInRes.data.user.id };
}

describe('RLS policy tests', () => {
  if (shouldSkip) {
    it('skipped because Supabase credentials are not set', () => {
      console.warn('Supabase credentials missing, skipping RLS tests');
    });
    return;
  }

  const testEmail = `rls-test-${Date.now()}@example.com`;
  const testPassword = 'rls-test-pass';
  let userId: string;

  beforeAll(async () => {
    // create user via service role
    const { data, error } = await serviceClient!.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (error || !data?.user) throw new Error(`Failed to create user: ${error?.message}`);
    userId = data.user.id;

    // create profile record
    const { error: profError } = await serviceClient!
      .from('profiles')
      .insert({ user_id: userId, display_name: 'Initial User' });
    if (profError) throw new Error(`Failed to create profile: ${profError.message}`);
  });

  afterAll(async () => {
    if (!serviceClient) return;
    await serviceClient.from('profiles').delete().eq('user_id', userId);
    await serviceClient.auth.admin.deleteUser(userId);
  });

  it('rejects profile update from anonymous client', async () => {
    const { error } = await anonClient!
      .from('profiles')
      .update({ display_name: 'Hacker' })
      .eq('user_id', userId);

    expect(error).not.toBeNull();
    // 42501 is insufficient privilege
    expect(error?.code).toBe('42501');
  });

  it('allows profile update for authenticated user', async () => {
    const { client } = await createAuthedClient(testEmail, testPassword);

    const { data, error } = await client
      .from('profiles')
      .update({ display_name: 'Updated User' })
      .eq('user_id', userId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.display_name).toBe('Updated User');
  });
});
