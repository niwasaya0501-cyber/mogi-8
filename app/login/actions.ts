"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SendMagicLinkResult = { error?: string; sent?: boolean };

export async function sendMagicLink(_prevState: SendMagicLinkResult, formData: FormData): Promise<SendMagicLinkResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "メールアドレスを入力してください" };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}
