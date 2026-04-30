import type { Macros } from "../types";
import MacroBar from "./MacroBar";

interface MacroSummaryProps {
  totals: Macros;
  goals: Macros;
  burnedKcal?: number;
  onBurnedKcalChange?: (v: number) => void;
}

const MACRO_CONFIG = [
  { key: "protein" as const, label: "Protein", unit: "g", color: "#3b82f6" },
  {
    key: "carbs" as const,
    label: "Kohlenhydrate",
    unit: "g",
    color: "#8b5cf6",
  },
  { key: "fat" as const, label: "Fett", unit: "g", color: "#ef4444" },
  {
    key: "fiber" as const,
    label: "Ballaststoffe",
    unit: "g",
    color: "#22c55e",
  },
  { key: "sugar" as const, label: "Zucker", unit: "g", color: "#ec4899" },
  { key: "salt" as const, label: "Salz", unit: "g", color: "#64748b" },
];

export default function MacroSummary({
  totals,
  goals,
  burnedKcal = 0,
  onBurnedKcalChange,
}: MacroSummaryProps) {
  const consumed = Math.round(totals.kcal);
  const balance = consumed - burnedKcal;
  const balanceSign = balance > 0 ? "+" : "";
  const balanceClass =
    balance > 0
      ? "kcal-stat--surplus"
      : balance < 0
        ? "kcal-stat--deficit"
        : "";

  return (
    <>
      <div className="kcal-section">
        <MacroBar
          label="Kalorien"
          value={consumed}
          goal={goals.kcal}
          unit="kcal"
          color="#f59e0b"
        />
        <div className="kcal-stats">
          <div className="kcal-stat">
            <span className="kcal-stat__label">🔥 Verbrannt</span>
            <div className="kcal-stat__input-row">
              <input
                className="input kcal-stat__input"
                type="number"
                min={0}
                value={burnedKcal}
                readOnly={!onBurnedKcalChange}
                onChange={(e) =>
                  onBurnedKcalChange?.(Math.max(0, Number(e.target.value)))
                }
              />
              <span className="kcal-stat__unit">kcal</span>
            </div>
          </div>
          <div className={`kcal-stat ${balanceClass}`}>
            <span className="kcal-stat__label">⚖️ Bilanz</span>
            <div className="kcal-stat__value-row">
              <span className="kcal-stat__value">
                {balanceSign}
                {balance}
              </span>
              <span className="kcal-stat__unit">kcal</span>
            </div>
          </div>
        </div>
      </div>
      <div className="macro-summary">
        {MACRO_CONFIG.map(({ key, label, unit, color }) => (
          <MacroBar
            key={key}
            label={label}
            value={Math.round(totals[key] * 10) / 10}
            goal={goals[key]}
            unit={unit}
            color={color}
          />
        ))}
      </div>
    </>
  );
}
