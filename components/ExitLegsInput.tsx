"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface ExitLeg {
  contracts: string;
  exitPrice: string;
  closedAt: string;
}

const inputClass =
  "w-full rounded-md bg-panel-inset border border-panel-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-gain/50";

export function ExitLegsInput() {
  const [legs, setLegs] = useState<ExitLeg[]>([{ contracts: "", exitPrice: "", closedAt: "" }]);

  const update = (i: number, field: keyof ExitLeg, value: string) => {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };

  const addLeg = () => {
    setLegs((prev) => [...prev, { contracts: "", exitPrice: "", closedAt: "" }]);
  };

  const removeLeg = (i: number) => {
    setLegs((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const totalContracts = legs.reduce((sum, l) => sum + (parseFloat(l.contracts) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs text-ink-muted">
          Ausstieg{legs.length > 1 ? "e (Teilgewinnmitnahme)" : ""}
        </label>
        <button
          type="button"
          onClick={addLeg}
          className="flex items-center gap-1 text-xs text-gain hover:underline"
        >
          <Plus size={12} />
          Weiteren Ausstieg hinzufügen
        </button>
      </div>

      <div className="space-y-2">
        {legs.map((leg, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2 items-start">
            <div>
              {i === 0 && <span className="text-[10px] text-ink-faint">Kontrakte</span>}
              <input
                name={`legContracts_${i}`}
                type="number"
                step="0.01"
                required
                value={leg.contracts}
                onChange={(e) => update(i, "contracts", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              {i === 0 && <span className="text-[10px] text-ink-faint">Exit-Preis</span>}
              <input
                name={`legExitPrice_${i}`}
                type="number"
                step="0.00001"
                required
                value={leg.exitPrice}
                onChange={(e) => update(i, "exitPrice", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              {i === 0 && <span className="text-[10px] text-ink-faint">Ausstiegszeit</span>}
              <input
                name={`legClosedAt_${i}`}
                type="datetime-local"
                required
                value={leg.closedAt}
                onChange={(e) => update(i, "closedAt", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className={i === 0 ? "pt-5" : ""}>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="text-ink-faint hover:text-loss p-1.5"
                  title="Ausstieg entfernen"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <input type="hidden" name="legCount" value={legs.length} />

      <p className="text-xs text-ink-faint mt-2">
        {legs.length > 1 ? (
          <>
            Gesamt {totalContracts || 0} Kontrakte über {legs.length} Ausstiege — wird
            beim Speichern als {legs.length} einzelne Trades angelegt (gleicher
            Entry, je Ausstieg ein eigener Exit).
          </>
        ) : (
          "Bei einer Teilgewinnmitnahme (z. B. 2 Kontrakte, 1 früher raus) einfach einen weiteren Ausstieg hinzufügen."
        )}
      </p>
    </div>
  );
}
