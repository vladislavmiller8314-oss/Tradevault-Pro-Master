"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAccount(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const startingBalance = parseFloat(formData.get("startingBalance") as string) || 0;
  const currency = (formData.get("currency") as string) || "USD";
  const broker = (formData.get("broker") as string) || null;

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    starting_balance: startingBalance,
    currency,
    broker,
  });

  if (error) {
    redirect(`/accounts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/accounts");
  revalidatePath("/trades/new");
  redirect("/accounts");
}

export async function archiveAccount(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = formData.get("accountId") as string;

  await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", accountId)
    .eq("user_id", user.id);

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/trades/new");
}

export async function reactivateAccount(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = formData.get("accountId") as string;

  await supabase
    .from("accounts")
    .update({ is_archived: false })
    .eq("id", accountId)
    .eq("user_id", user.id);

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/trades/new");
}

export async function deleteAccount(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = formData.get("accountId") as string;

  // Löscht auch alle Trades auf diesem Konto (on delete cascade im Schema).
  await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", user.id);

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/trades/new");
}
