export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="h-6 w-56 rounded-full bg-gray-100" />
          <div className="h-12 w-full max-w-xl rounded-3xl bg-gray-100" />
          <div className="h-12 w-full max-w-md rounded-3xl bg-gray-100" />
          <div className="h-4 w-full max-w-xl rounded-full bg-gray-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-44 rounded-full bg-gray-100" />
          <div className="h-10 w-36 rounded-full bg-gray-100" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]"
          >
            <div className="h-11 w-11 rounded-2xl bg-gray-100" />
            <div className="mt-7 h-3 w-24 rounded-full bg-gray-100" />
            <div className="mt-3 h-7 w-32 rounded-2xl bg-gray-100" />
            <div className="mt-4 h-3 w-40 rounded-full bg-gray-100" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)] xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-48 rounded-full bg-gray-100" />
              <div className="h-3 w-72 rounded-full bg-gray-100" />
            </div>
            <div className="h-7 w-16 rounded-full bg-gray-100" />
          </div>
          <div className="mt-6 h-[320px] rounded-2xl bg-gray-50" />
        </div>
        <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)]">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-32 rounded-full bg-gray-100" />
                <div className="h-1.5 w-full rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-white p-7 shadow-[var(--shadow-card)] xl:col-span-2">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/5 rounded-full bg-gray-100" />
                  <div className="h-1.5 w-full rounded-full bg-gray-100" />
                </div>
                <div className="h-8 w-16 rounded-2xl bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-80 rounded-3xl border border-border bg-white shadow-[var(--shadow-card)]" />
      </section>
    </div>
  );
}
