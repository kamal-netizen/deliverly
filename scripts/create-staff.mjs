/**
 * Create an office-staff user.
 *
 * Replaces the old public POST /api/auth/register, which let anyone on the
 * internet mint a staff account. Bootstrapping happens once, so it should cost
 * filesystem access rather than a permanent network endpoint.
 *
 *   npm run create-staff -- <email> <password> [name]
 */
import { createClient } from '@supabase/supabase-js';

const [email, password, ...nameParts] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-staff -- <email> <password> [name]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'This script reads .env.local via node --env-file; check that it exists.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name: nameParts.join(' ') || email.split('@')[0] },
  // app_metadata is writable only by the service role. Putting the role in
  // user_metadata would let the user rewrite it with the public anon key.
  app_metadata: { role: 'staff' },
});

if (error) {
  console.error('Failed to create staff user:', error.message);
  process.exit(1);
}

console.log(`Created staff user ${data.user.email} (${data.user.id})`);
