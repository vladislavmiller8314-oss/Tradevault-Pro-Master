import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Wird von Supabase nach Klick auf den Bestätigungslink aufgerufen
// (siehe emailRedirectTo in app/login/actions.ts).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Bestätigung%20fehlgeschlagen`);
}
