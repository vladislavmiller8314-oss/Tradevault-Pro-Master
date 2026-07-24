import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Für Server Components / Server Actions. Liest & schreibt die
// Session über Next.js-Cookies, damit sie mit der Middleware synchron bleibt.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // set() wird in Server Components ignoriert, wenn sie außerhalb
            // einer Server Action/Route aufgerufen wird — die Middleware
            // aktualisiert die Session in diesem Fall stattdessen.
          }
        },
      },
    }
  );
}
