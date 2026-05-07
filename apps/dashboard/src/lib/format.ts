const COMPACT_RO = new Intl.NumberFormat("ro-RO", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const STANDARD_RO = new Intl.NumberFormat("ro-RO");
const PERCENT_RO = new Intl.NumberFormat("ro-RO", {
  style: "percent",
  maximumFractionDigits: 1,
});
const RELATIVE_RO = new Intl.RelativeTimeFormat("ro-RO", { numeric: "auto" });

export function compact(n: number): string {
  return COMPACT_RO.format(n);
}

export function standard(n: number): string {
  return STANDARD_RO.format(n);
}

export function percent(ratio: number): string {
  return PERCENT_RO.format(ratio);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  if (abs < MINUTE) return RELATIVE_RO.format(Math.round(diff / SECOND), "second");
  if (abs < HOUR) return RELATIVE_RO.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return RELATIVE_RO.format(Math.round(diff / HOUR), "hour");
  return RELATIVE_RO.format(Math.round(diff / DAY), "day");
}

export function id(prefix: string): string {
  const rand = crypto.getRandomValues(new Uint8Array(6));
  let s = "";
  for (const byte of rand) s += byte.toString(16).padStart(2, "0");
  return `${prefix}_${s}`;
}
