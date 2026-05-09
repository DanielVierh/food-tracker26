import type { Macros } from "../types";
import MacroBar from "./MacroBar";

interface MacroSummaryProps {
  totals: Macros;
  goals: Macros;
  burnedKcal?: number;
  onBurnedKcalChange?: (v: number) => void;
  steps?: number;
  onStepsChange?: (v: number) => void;
  variant?: "full" | "compact";
}

const MACRO_CONFIG = [
  {
    key: "protein" as const,
    label: "Protein",
    unit: "g",
    higherIsBetter: true,
  },
  { key: "fat" as const, label: "Fett", unit: "g", higherIsBetter: false },
  {
    key: "carbs" as const,
    label: "Kohlenhydrate",
    unit: "g",
    higherIsBetter: false,
  },
  { key: "sugar" as const, label: "Zucker", unit: "g", higherIsBetter: false },
  {
    key: "fiber" as const,
    label: "Ballaststoffe",
    unit: "g",
    higherIsBetter: true,
  },
  { key: "salt" as const, label: "Salz", unit: "g", higherIsBetter: false },
];

const COMPACT_CONFIG = [
  {
    key: "kcal" as const,
    label: "Kalorien",
    unit: "kcal",
    higherIsBetter: false,
    isKcal: true,
  },
  {
    key: "protein" as const,
    label: "Protein",
    unit: "g",
    higherIsBetter: true,
    isKcal: false,
  },
  {
    key: "carbs" as const,
    label: "Kohlenhydrate",
    unit: "g",
    higherIsBetter: false,
    isKcal: false,
  },
  {
    key: "sugar" as const,
    label: "Zucker",
    unit: "g",
    higherIsBetter: false,
    isKcal: false,
  },
  {
    key: "fiber" as const,
    label: "Bal",
    unit: "g",
    higherIsBetter: true,
    isKcal: false,
  },
  {
    key: "fat" as const,
    label: "Fett",
    unit: "g",
    higherIsBetter: false,
    isKcal: false,
  },
];

export default function MacroSummary({
  totals,
  goals,
  burnedKcal = 0,
  onBurnedKcalChange,
  steps = 0,
  onStepsChange,
  variant = "full",
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
      {variant === "full" && (
        <div className="kcal-section">
          <MacroBar
            label="Kalorien"
            value={consumed}
            goal={goals.kcal}
            unit="kcal"
          />
          <div className="kcal-stats">
            <div className="kcal-stat">
              <span className="kcal-stat__label">👟 Schritte</span>
              <div className="kcal-stat__input-row">
                <input
                  className="input kcal-stat__input"
                  type="number"
                  min={0}
                  step={100}
                  value={steps}
                  readOnly={!onStepsChange}
                  onChange={(e) =>
                    onStepsChange?.(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>
            </div>
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
      )}

      {variant === "compact" ? (
        <div className="macro-summary macro-summary--compact">
          {COMPACT_CONFIG.map(
            ({ key, label, unit, higherIsBetter, isKcal }) => (
              <MacroBar
                key={key}
                label={label}
                value={isKcal ? consumed : Math.round(totals[key] * 10) / 10}
                goal={goals[key] / 4}
                unit={unit}
                higherIsBetter={higherIsBetter}
                size="sm"
              />
            ),
          )}
        </div>
      ) : (
        <div className="macro-summary">
          {MACRO_CONFIG.map(({ key, label, unit, higherIsBetter }) => (
            <MacroBar
              key={key}
              label={label}
              value={Math.round(totals[key] * 10) / 10}
              goal={goals[key]}
              unit={unit}
              higherIsBetter={higherIsBetter}
            />
          ))}
        </div>
      )}
    </>
  );
}
