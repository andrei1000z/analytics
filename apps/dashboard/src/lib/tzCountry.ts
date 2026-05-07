/**
 * Coarse IANA-timezone → country mapping. Covers EU + major global zones.
 * Better than IP geolocation for privacy (timezone has ~hundreds of buckets,
 * IP has billions). Trades precision for honesty: a Cluj user with timezone
 * "Europe/Bucharest" maps to RO, an actual Berlin user with "Europe/Berlin"
 * maps to DE.
 */

const MAP: Record<string, { code: string; name: string }> = {
  // EU
  "Europe/Bucharest": { code: "RO", name: "România" },
  "Europe/Berlin": { code: "DE", name: "Germania" },
  "Europe/Paris": { code: "FR", name: "Franța" },
  "Europe/Madrid": { code: "ES", name: "Spania" },
  "Europe/Rome": { code: "IT", name: "Italia" },
  "Europe/London": { code: "GB", name: "Regatul Unit" },
  "Europe/Amsterdam": { code: "NL", name: "Țările de Jos" },
  "Europe/Brussels": { code: "BE", name: "Belgia" },
  "Europe/Vienna": { code: "AT", name: "Austria" },
  "Europe/Zurich": { code: "CH", name: "Elveția" },
  "Europe/Warsaw": { code: "PL", name: "Polonia" },
  "Europe/Prague": { code: "CZ", name: "Cehia" },
  "Europe/Bratislava": { code: "SK", name: "Slovacia" },
  "Europe/Budapest": { code: "HU", name: "Ungaria" },
  "Europe/Sofia": { code: "BG", name: "Bulgaria" },
  "Europe/Athens": { code: "GR", name: "Grecia" },
  "Europe/Lisbon": { code: "PT", name: "Portugalia" },
  "Europe/Dublin": { code: "IE", name: "Irlanda" },
  "Europe/Stockholm": { code: "SE", name: "Suedia" },
  "Europe/Oslo": { code: "NO", name: "Norvegia" },
  "Europe/Copenhagen": { code: "DK", name: "Danemarca" },
  "Europe/Helsinki": { code: "FI", name: "Finlanda" },
  "Europe/Tallinn": { code: "EE", name: "Estonia" },
  "Europe/Riga": { code: "LV", name: "Letonia" },
  "Europe/Vilnius": { code: "LT", name: "Lituania" },
  "Europe/Luxembourg": { code: "LU", name: "Luxemburg" },
  "Europe/Malta": { code: "MT", name: "Malta" },
  "Europe/Nicosia": { code: "CY", name: "Cipru" },
  "Europe/Ljubljana": { code: "SI", name: "Slovenia" },
  "Europe/Zagreb": { code: "HR", name: "Croația" },
  "Europe/Belgrade": { code: "RS", name: "Serbia" },
  "Europe/Sarajevo": { code: "BA", name: "Bosnia" },
  "Europe/Skopje": { code: "MK", name: "Macedonia" },
  "Europe/Tirane": { code: "AL", name: "Albania" },
  "Europe/Chisinau": { code: "MD", name: "Republica Moldova" },
  "Europe/Kyiv": { code: "UA", name: "Ucraina" },
  "Europe/Kiev": { code: "UA", name: "Ucraina" },
  "Europe/Moscow": { code: "RU", name: "Rusia" },
  "Europe/Istanbul": { code: "TR", name: "Turcia" },

  // Americas
  "America/New_York": { code: "US", name: "Statele Unite" },
  "America/Chicago": { code: "US", name: "Statele Unite" },
  "America/Denver": { code: "US", name: "Statele Unite" },
  "America/Los_Angeles": { code: "US", name: "Statele Unite" },
  "America/Phoenix": { code: "US", name: "Statele Unite" },
  "America/Anchorage": { code: "US", name: "Statele Unite" },
  "America/Toronto": { code: "CA", name: "Canada" },
  "America/Vancouver": { code: "CA", name: "Canada" },
  "America/Mexico_City": { code: "MX", name: "Mexic" },
  "America/Sao_Paulo": { code: "BR", name: "Brazilia" },
  "America/Argentina/Buenos_Aires": { code: "AR", name: "Argentina" },
  "America/Bogota": { code: "CO", name: "Columbia" },
  "America/Lima": { code: "PE", name: "Peru" },
  "America/Santiago": { code: "CL", name: "Chile" },

  // Asia
  "Asia/Tokyo": { code: "JP", name: "Japonia" },
  "Asia/Seoul": { code: "KR", name: "Coreea de Sud" },
  "Asia/Shanghai": { code: "CN", name: "China" },
  "Asia/Hong_Kong": { code: "HK", name: "Hong Kong" },
  "Asia/Singapore": { code: "SG", name: "Singapore" },
  "Asia/Bangkok": { code: "TH", name: "Thailanda" },
  "Asia/Jakarta": { code: "ID", name: "Indonezia" },
  "Asia/Kuala_Lumpur": { code: "MY", name: "Malaezia" },
  "Asia/Manila": { code: "PH", name: "Filipine" },
  "Asia/Ho_Chi_Minh": { code: "VN", name: "Vietnam" },
  "Asia/Kolkata": { code: "IN", name: "India" },
  "Asia/Calcutta": { code: "IN", name: "India" },
  "Asia/Dubai": { code: "AE", name: "Emiratele Arabe" },
  "Asia/Riyadh": { code: "SA", name: "Arabia Saudită" },
  "Asia/Tel_Aviv": { code: "IL", name: "Israel" },
  "Asia/Jerusalem": { code: "IL", name: "Israel" },
  "Asia/Taipei": { code: "TW", name: "Taiwan" },
  "Asia/Karachi": { code: "PK", name: "Pakistan" },
  "Asia/Tehran": { code: "IR", name: "Iran" },

  // Oceania
  "Australia/Sydney": { code: "AU", name: "Australia" },
  "Australia/Melbourne": { code: "AU", name: "Australia" },
  "Australia/Perth": { code: "AU", name: "Australia" },
  "Pacific/Auckland": { code: "NZ", name: "Noua Zeelandă" },

  // Africa
  "Africa/Cairo": { code: "EG", name: "Egipt" },
  "Africa/Johannesburg": { code: "ZA", name: "Africa de Sud" },
  "Africa/Lagos": { code: "NG", name: "Nigeria" },
  "Africa/Nairobi": { code: "KE", name: "Kenya" },
  "Africa/Casablanca": { code: "MA", name: "Maroc" },
};

export function tzToCountry(tz: string | undefined): { code: string; name: string } {
  if (!tz) return { code: "??", name: "Necunoscut" };
  const hit = MAP[tz];
  if (hit) return hit;
  // Fallback: derive from continent prefix, e.g. "Europe/Tirana" → unknown.
  const continent = tz.split("/")[0] ?? "";
  if (continent === "Europe") return { code: "EU", name: "Europa (alt)" };
  if (continent === "America") return { code: "AM", name: "America (alt)" };
  if (continent === "Asia") return { code: "AS", name: "Asia (alt)" };
  if (continent === "Africa") return { code: "AF", name: "Africa (alt)" };
  if (continent === "Australia" || continent === "Pacific") return { code: "OC", name: "Oceania (alt)" };
  return { code: "??", name: "Necunoscut" };
}
