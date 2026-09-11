"use client";

import { useActionState } from "react";
import { sendMagicLink, type SendMagicLinkResult } from "./actions";

const initialState: SendMagicLinkResult = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-brand-navy">AI売上ダッシュボード</h1>
        <p className="text-sm text-zinc-600">登録済みメールアドレスにログイン用リンクを送ります</p>
      </div>

      {state.sent ? (
        <p className="rounded-md border border-brand-navy/20 bg-brand-navy/5 p-4 text-sm text-brand-navy">
          メールを送信しました。届いたリンクをクリックしてログインしてください。
        </p>
      ) : (
        <form action={formAction} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            placeholder="you@example.com"
          />
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "送信中..." : "ログインリンクを送る"}
          </button>
        </form>
      )}
    </main>
  );
}
