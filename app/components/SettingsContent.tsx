"use client";

import { useState } from "react";
import {
  Bell,
  FileText,
  Globe,
  KeyRound,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import CopySnippet from "./CopySnippet";

type ToggleProps = {
  label: string;
  description: string;
  defaultOn?: boolean;
};

function Toggle({ label, description, defaultOn = false }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-gray-900">
          {label}
        </p>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          on ? "bg-accent" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-8 shadow-[var(--shadow-card)]">
      <header className="flex items-start gap-4 border-b border-border pb-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </header>
      <div className="mt-2 divide-y divide-border">{children}</div>
    </section>
  );
}

export default function SettingsContent({ snippet }: { snippet: string }) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          Setări cont · privacy by default
        </span>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
          Setări
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-500">
          Gestionează preferințele de notificare, datele contului și
          integrările. Toate setările se aplică instant — fără cookie-uri și
          fără tracking între site-uri.
        </p>
      </header>

      <Card
        icon={KeyRound}
        title="Integrare tracker"
        description="Lipește snippet-ul în <head> și datele apar live în câteva secunde."
      >
        <div className="py-5">
          <CopySnippet snippet={snippet} />
          <ul className="mt-5 grid gap-2 text-xs text-gray-500 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Asynchronous, &lt; 2 KB minified
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Fără cookie-uri / localStorage
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Folosește sendBeacon când e disponibil
            </li>
          </ul>
        </div>
      </Card>

      <Card
        icon={Bell}
        title="Notificări"
        description="Alege ce mesaje primești și cât de des."
      >
        <Toggle
          label="Notificări pe email"
          description="Trimitem un email de îndată ce un eveniment important este detectat (anomalii de trafic, atingere prag de conversie)."
          defaultOn
        />
        <Toggle
          label="Rapoarte săptămânale"
          description="Sumar al ultimelor 7 zile, livrat în fiecare luni dimineață la 09:00 EET."
          defaultOn
        />
        <Toggle
          label="Alerte timp real"
          description="Push notification în browser când traficul live depășește o valoare configurabilă."
        />
      </Card>

      <Card
        icon={User}
        title="Profil"
        description="Datele afișate în interiorul aplicației și pe rapoarte."
      >
        <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-tight text-gray-700">
              Nume
            </span>
            <input
              type="text"
              defaultValue="Andrei Musat"
              className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-tight text-gray-700">
              Email
            </span>
            <input
              type="email"
              defaultValue="andrei@euroanalytics.ro"
              className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-xs font-medium tracking-tight text-gray-700">
              Site principal
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
              <Globe className="h-4 w-4 text-gray-400" strokeWidth={2} />
              <input
                type="url"
                defaultValue="https://euroanalytics.ro"
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
              />
            </div>
          </label>
        </div>
      </Card>

      <Card
        icon={ShieldCheck}
        title="Confidențialitate"
        description="Politici aplicate automat pe toate datele tale."
      >
        <Toggle
          label="Anonimizare suplimentară IP"
          description="IP-urile nu sunt stocate, dar putem trunchia și ultimul octet la nivel de proxy edge pentru un strat în plus."
          defaultOn
        />
        <div className="flex items-center justify-between gap-4 py-5">
          <div>
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              Șterge tot istoricul
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Operațiune permanentă. Datele șterse nu pot fi recuperate.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            Solicită ștergerea
          </button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Anulează
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[var(--shadow-soft)] hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" strokeWidth={2.25} />
          Salvează modificările
        </button>
      </div>
    </div>
  );
}
