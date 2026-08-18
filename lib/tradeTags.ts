export interface EmotionOption {
  value: string;
  emoji: string;
}

// Eine gemeinsame Liste für "Emotion vorher", "Emotion nachher" und das
// Bearbeiten-Formular — damit überall dieselben Optionen zur Auswahl
// stehen, egal wo man die Emotion einträgt oder nachträglich ändert.
export const EMOTIONS: EmotionOption[] = [
  { value: "Ruhig", emoji: "😌" },
  { value: "Zuversichtlich", emoji: "😊" },
  { value: "Diszipliniert", emoji: "🧘" },
  { value: "Neutral", emoji: "😐" },
  { value: "Müde", emoji: "😴" },
  { value: "Nervös", emoji: "😰" },
  { value: "Gestresst", emoji: "😣" },
  { value: "Ungeduldig", emoji: "😤" },
  { value: "Unsicher", emoji: "😟" },
  { value: "Angst", emoji: "😨" },
  { value: "Gier", emoji: "🤑" },
  { value: "FOMO", emoji: "🏃" },
  { value: "Rache", emoji: "😡" },
  { value: "Euphorisch", emoji: "🤩" },
  { value: "Frustriert", emoji: "😖" },
  { value: "Hoffnungsvoll", emoji: "🤞" },
  { value: "Erleichtert", emoji: "😅" },
  { value: "Enttäuscht", emoji: "😞" },
  { value: "Fokussiert", emoji: "🎯" },
  { value: "Übermütig", emoji: "😎" },
  { value: "Gelangweilt", emoji: "🥱" },
  { value: "Panisch", emoji: "😱" },
  { value: "Stolz", emoji: "🙌" },
];

export interface RuleOption {
  value: "eingehalten" | "teilweise" | "gebrochen";
  emoji: string;
  label: string;
}

export const RULE_OPTIONS: RuleOption[] = [
  { value: "eingehalten", emoji: "✅", label: "Eingehalten" },
  { value: "teilweise", emoji: "⚠️", label: "Teilweise" },
  { value: "gebrochen", emoji: "❌", label: "Gebrochen" },
];
