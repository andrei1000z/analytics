"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, Loader2, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Autentificare eșuată.");
        setSubmitting(false);
        return;
      }

      startTransition(() => {
        router.replace(from);
        router.refresh();
      });
    } catch {
      setError("Probleme de rețea. Reîncearcă.");
      setSubmitting(false);
    }
  }

  const isPending = pending || submitting;

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-3xl border border-border bg-white p-10 shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accent text-white shadow-[var(--shadow-soft)]">
          <Sparkles className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Bine ai revenit
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
          Dashboard-ul EuroAnalytics e protejat. Introdu parola de admin pentru
          a continua.
        </p>
      </div>

      <label className="mt-8 flex flex-col gap-2">
        <span className="text-xs font-medium tracking-tight text-gray-700">
          Parolă administrator
        </span>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
          <KeyRound className="h-4 w-4 text-gray-400" strokeWidth={2} />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </label>

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !password}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
        ) : (
          <>
            Intră în dashboard
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-canvas p-4 text-xs leading-relaxed text-gray-500">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
          strokeWidth={2.25}
        />
        <span>
          Sesiunea e stocată într-un cookie httpOnly, valabil 30 de zile. Fără
          tracking, fără terți.
        </span>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-accent-soft to-transparent" />
      <Suspense
        fallback={
          <div className="h-[420px] w-full max-w-md rounded-3xl bg-white shadow-[var(--shadow-soft)]" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
