// Wandelt einen "naiven" Zeitstempel (ohne Zeitzoneninfo, so wie er in
// den meisten Broker-CSV-Exporten steht) unter Angabe einer IANA-Zeitzone
// korrekt in UTC um — inklusive Sommerzeit/Winterzeit. Ohne das würde
// z. B. "13:48:38" aus der Datei als UTC gespeichert und beim Anzeigen im
// Browser nochmal in die lokale Zeitzone verschoben — macht die Zeit dann
// doppelt falsch.
// Erkennt Datum in "YYYY-MM-DD" (ISO-artig), "DD.MM.YYYY" (europäisches
// Punkt-Format, z. B. Trading-Simulator-Exporte) oder "DD/MM/YYYY" bzw.
// "MM/DD/YYYY" (Schrägstrich — bei Werten >12 im ersten Teil wird das als
// Tag gewertet, sonst als US-Format angenommen).
function parseDateParts(datePart: string): { y: number; m: number; d: number } | null {
  let y: number, m: number, d: number;

  if (datePart.includes(".")) {
    [d, m, y] = datePart.split(".").map(Number);
  } else if (datePart.includes("/")) {
    const parts = datePart.split("/").map(Number);
    if (parts[0] > 12) {
      [d, m, y] = parts;
    } else {
      [m, d, y] = parts;
    }
  } else {
    [y, m, d] = datePart.split("-").map(Number);
  }

  if (!y || !m || !d) return null;
  // Zweistellige Jahreszahlen (selten, aber sicherheitshalber abgefangen)
  if (y < 100) y += 2000;
  return { y, m, d };
}

// Wandelt einen "naiven" Zeitstempel (ohne Zeitzoneninfo, so wie er in
// den meisten Broker-CSV-Exporten steht) unter Angabe einer IANA-Zeitzone
// korrekt in UTC um — inklusive Sommerzeit/Winterzeit. Ohne das würde
// z. B. "13:48:38" aus der Datei als UTC gespeichert und beim Anzeigen im
// Browser nochmal in die lokale Zeitzone verschoben — macht die Zeit dann
// doppelt falsch.
export function zonedTimeToUtc(dateTimeStr: string, timeZone: string): Date {
  const cleaned = dateTimeStr.trim().replace("T", " ");
  const [datePart, timePart = "00:00:00"] = cleaned.split(" ");
  const parsed = parseDateParts(datePart);
  const [hh, mm, ss] = timePart.split(":").map((n) => Number(n) || 0);

  if (!parsed) {
    return new Date(NaN);
  }
  const { y, m, d } = parsed;

  // Erste Näherung: die Zahlen so nehmen, als wären sie schon UTC.
  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);

  // Herausfinden, wie diese UTC-Zahlen in der Ziel-Zeitzone aussehen würden —
  // die Differenz dazu ist der tatsächliche Zeitzonen-Offset an diesem Datum.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(asUTC));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  const tzAsIfUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")) % 24,
    Number(get("minute")),
    Number(get("second"))
  );

  const offset = tzAsIfUTC - asUTC;
  return new Date(asUTC - offset);
}

export const IMPORT_TIMEZONES = [
  { value: "Europe/Berlin", label: "Mitteleuropa (Berlin) — Sommer-/Winterzeit" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US Eastern (New York)" },
  { value: "America/Chicago", label: "US Central (Chicago)" },
];
