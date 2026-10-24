function requiredEnv(name: string, value: string | undefined) {

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and add the value from Supabase Dashboard → Settings → API.`
    );
  }

  return value;
}

export function getSupabasePublicEnv() {
  return {
    // Keep these as direct process.env references. Next.js replaces direct
    // NEXT_PUBLIC_* references in the browser bundle at build time.
    url: requiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getSupabaseAdminEnv() {
  return {
    url: requiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}
