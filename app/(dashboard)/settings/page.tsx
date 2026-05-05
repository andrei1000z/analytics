import { headers } from "next/headers";
import SettingsContent from "../../components/SettingsContent";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-domain";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin =
    host.startsWith("localhost") || host.startsWith("127.")
      ? `http://${host}`
      : `${proto}://${host}`;
  const snippet = `<script defer src="${origin}/script.js"></script>`;

  return <SettingsContent snippet={snippet} />;
}
