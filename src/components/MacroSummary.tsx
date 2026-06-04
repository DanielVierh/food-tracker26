import { useEffect, useState } from "react";
import type { Macros } from "../types";
import MacroBar from "./MacroBar";

const MACRO_VIEW_MODE_KEY = "macro-summary-view-mode";

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
    label: "Kcl",
    unit: "kcal",
    higherIsBetter: false,
    isKcal: true,
  },
  {
    key: "protein" as const,
    label: "PR",
    unit: "g",
    higherIsBetter: true,
    isKcal: false,
  },
  {
    key: "carbs" as const,
    label: "KH",
    unit: "g",
    higherIsBetter: false,
    isKcal: false,
  },
  {
    key: "sugar" as const,
    label: "ZCK",
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
    label: "FT",
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
  const effective_kcal = Math.round(consumed - burnedKcal);
  const balance = Math.round(goals.kcal) - consumed + burnedKcal;
  const balanceSign = balance > 0 ? "+" : "";
  const balanceClass =
    balance < 0
      ? "kcal-stat--surplus"
      : balance > 0
        ? "kcal-stat--deficit"
        : "";

  const [viewMode, setViewMode] = useState<"bar" | "ring">(() => {
    const stored = localStorage.getItem(MACRO_VIEW_MODE_KEY);
    return stored === "ring" || stored === "bar" ? stored : "bar";
  });
  const [stepsStr, setStepsStr] = useState(() =>
    steps > 0 ? String(steps) : "",
  );
  const [burnedStr, setBurnedStr] = useState(() =>
    burnedKcal > 0 ? String(burnedKcal) : "",
  );
  const [prevBurnedKcal, setPrevBurnedKcal] = useState(burnedKcal);

  if (prevBurnedKcal !== burnedKcal) {
    setPrevBurnedKcal(burnedKcal);
    setBurnedStr(burnedKcal > 0 ? String(burnedKcal) : "");
  }

  useEffect(() => {
    localStorage.setItem(MACRO_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  return (
    <>
      {variant === "full" && (
        <div className="kcal-section">
          <MacroBar
            label="Kalorien"
            value={effective_kcal}
            goal={goals.kcal}
            unit="kcal"
            view="ring"
          />
          <div className="kcal-stats">
            <div className={`kcal-stat ${balanceClass}`}>
              <span className="kcal-stat__label">🍎 - Gegessen</span>
              <div className="kcal-stat__value-row">
                <span className="kcal-stat__value">{consumed}</span>
                <span className="kcal-stat__unit">kcal</span>
              </div>
            </div>
            <div className="kcal-stat">
              <span className="kcal-stat__label">👟 Schritte</span>
              <div className="kcal-stat__input-row">
                <input
                  className="input kcal-stat__input"
                  type="number"
                  min={0}
                  step={100}
                  value={stepsStr}
                  readOnly={!onStepsChange}
                  onChange={(e) => {
                    setStepsStr(e.target.value);
                    onStepsChange?.(Math.max(0, Number(e.target.value) || 0));
                  }}
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
                  value={burnedStr}
                  readOnly={!onBurnedKcalChange}
                  onChange={(e) => {
                    setBurnedStr(e.target.value);
                    onBurnedKcalChange?.(
                      Math.max(0, Number(e.target.value) || 0),
                    );
                  }}
                />
                <span className="kcal-stat__unit">kcal</span>
              </div>
            </div>
            <div className={`kcal-stat ${balanceClass}`}>
              <span className="kcal-stat__label">⚖️ Effektiv (Übrig)</span>
              <div className="kcal-stat__value-row">
                <span className="kcal-stat__value">{effective_kcal}</span>
                <span className="kcal-stat__value">
                  ({balanceSign}
                  {balance})
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
                view="ring"
              />
            ),
          )}
        </div>
      ) : (
        <div
          className={`macro-summary${viewMode === "bar" ? " macro-summary--bars" : ""}`}
        >
          <button
            className="macro-summary-toggle"
            onClick={() => setViewMode((v) => (v === "bar" ? "ring" : "bar"))}
            title={viewMode === "bar" ? "Ringansicht" : "Balkenansicht"}
          >
            {viewMode === "bar" ? "⬤" : "▬"}
          </button>
          {MACRO_CONFIG.map(({ key, label, unit, higherIsBetter }) => (
            <MacroBar
              key={key}
              label={label}
              value={Math.round(totals[key] * 10) / 10}
              goal={goals[key]}
              unit={unit}
              higherIsBetter={higherIsBetter}
              view={viewMode}
            />
          ))}
        </div>
      )}
    </>
  );
}
