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
