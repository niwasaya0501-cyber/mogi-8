"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { runAnalysisFromUpload, type UploadAnalysisState } from "@/app/actions";

const initialState: UploadAnalysisState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-navy px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "分析中…" : "CSVをアップロードして分析"}
    </button>
  );
}

export function UploadAnalysisForm() {
  const [state, formAction] = useActionState(runAnalysisFromUpload, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="salesCsv" className="block text-base font-medium text-zinc-700">
          売上CSVファイル
        </label>
        <input
          id="salesCsv"
          type="file"
          name="salesCsv"
          accept=".csv,text/csv"
          required
          className="block w-full min-h-11 rounded-md border border-zinc-300 bg-white text-base text-zinc-700 file:mr-4 file:h-11 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:text-base file:font-medium file:text-zinc-700"
        />
      </div>

      <SubmitButton />

      {state.status === "error" ? (
        <p role="alert" className="flex items-start gap-2 text-base text-red-700">
          <span aria-hidden="true">⚠</span>
          <span>{state.message}</span>
        </p>
      ) : null}

      {state.status === "success" ? (
        <p role="status" className="flex items-start gap-2 text-base text-emerald-700">
          <span aria-hidden="true">✓</span>
          <span>{state.message}</span>
        </p>
      ) : null}
    </form>
  );
}
