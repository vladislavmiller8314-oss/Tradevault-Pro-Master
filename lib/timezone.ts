// Wandelt einen "naiven" Zeitstempel (ohne Zeitzoneninfo, so wie er in
// den meisten Broker-CSV-Exporten steht) unter Angabe einer IANA-Zeitzone
// korrekt in UTC um — inklusive Sommerzeit/Winterzeit. Ohne das würde
// z. B. "13:48:38" aus der Datei als UTC gespeichert und beim Anzeigen im
// Browser nochmal in die lokale Zeitzone verschoben — macht die Zeit dann
// doppelt falsch.
export function zonedTimeToUtc(dateTimeStr: string, timeZone: string): Date {
  const cleaned = dateTimeStr.trim().replace("T", " ");
  const [datePart, timePart = "00:00:00"] = cleaned.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm, ss] = timePart.split(":").map((n) => Number(n) || 0);

  if (!y || !m || !d) {
    return new Date(NaN);
  }

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
