type Source = {
  flag: string;
  country: string;
  visitors: number;
};

const sources: Source[] = [
  { flag: "🇷🇴", country: "România", visitors: 84 },
  { flag: "🇩🇪", country: "Germania", visitors: 41 },
  { flag: "🇫🇷", country: "Franța", visitors: 27 },
  { flag: "🇪🇸", country: "Spania", visitors: 18 },
  { flag: "🇮🇹", country: "Italia", visitors: 12 },
];

export default function LiveVisitors() {
  const total = sources.reduce((sum, s) => sum + s.visitors, 0);
  const max = Math.max(...sources.map((s) => s.visitors));
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">
            Vizitatori activi
          </h3>
          <p className="mt-1 text-sm text-gray-500">Distribuție pe țări — în timp real.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {total}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            online acum
          </span>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {sources.map((source) => (
          <li key={source.country} className="flex items-center gap-4">
            <span className="text-lg leading-none">{source.flag}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium tracking-tight text-gray-900">
                  {source.country}
                </span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {source.visitors}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-500"
                  style={{ width: `${(source.visitors / max) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
