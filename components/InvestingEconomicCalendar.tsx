// Investing.com Economic Calendar Widget — kostenloses Embed via iframe.
// Diese Auswahl an Ländern/Spalten deckt die wichtigsten Volkswirtschaften ab.
// Eigene Anpassungen (Farben, Länder, Sprache) lassen sich unter
// https://www.investing.com/webmaster-tools/economic-calendar generieren —
// dort auf de.investing.com wechseln für den korrekten lang-Parameter,
// falls die Beschriftungen weiterhin auf Englisch erscheinen.
const COUNTRIES = "110,17,29,25,32,6,37,36,26,5,22,39,14,48,10,35,7,43,38,4,12,72";
const CALENDAR_SRC =
  `https://sslecal2.investing.com?ecoDayBackground=%23161923&columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=${COUNTRIES}&calType=week&timeZone=8&lang=1`;

export function InvestingEconomicCalendar() {
  return (
    <div className="rounded-panel bg-panel-raised border border-panel-line p-4 shadow-instrument">
      <div className="text-xs uppercase tracking-wider text-ink-muted mb-3">Wirtschaftskalender</div>
      <div className="rounded-md overflow-hidden">
        <iframe
          src={CALENDAR_SRC}
          width="100%"
          height="380"
          frameBorder="0"
          title="Wirtschaftskalender von Investing.com"
        />
      </div>
      <div className="text-[10px] text-ink-faint mt-2 text-right">
        Kalender bereitgestellt von Investing.com
      </div>
    </div>
  );
}
