// Bewusst ohne externe Library (papaparse etc.), um keine zusätzliche
// Abhängigkeit für eine einzelne Funktion einzuführen. Deckt Standard-CSV
// ab: Kommas oder Semikolons als Trenner, Anführungszeichen für Felder mit
// Kommas/Zeilenumbrüchen, "" als Escape für ein Anführungszeichen im Feld.
export function parseCSV(text: string): string[][] {
  // Trennzeichen erkennen: manche Exporte (v. a. europäische Tools) nutzen ;
  const sample = text.slice(0, 2000);
  const delimiter = (sample.match(/;/g)?.length ?? 0) > (sample.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        pushField();
      } else if (char === "\r") {
        // ignorieren, \n übernimmt den Zeilenumbruch
      } else if (char === "\n") {
        pushRow();
      } else {
        field += char;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}
