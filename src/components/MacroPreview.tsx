import type { CSSProperties } from "react";
import { computeMacros } from "../utils/macros";
import type { Food } from "../types";

interface MacroPreviewProps {
  food: Food;
  amountG: number;
}

const MACRO_CHIPS = [
  { key: "kcal" as const, label: "Kalorien", unit: "kcal", color: "#f59e0b" },
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

export default function MacroPreview({ food, amountG }: MacroPreviewProps) {
  const preview = computeMacros(food, amountG);

  return (
    <div className="macro-preview">
      {food.quantityUnit && (
        <p className="macro-preview__unit-hint">
          Einheit: <strong>{food.quantityUnit}</strong>
        </p>
      )}
      <div className="macro-preview__header">
        <span />
        <span className="macro-preview__col-label">100 g</span>
        <span className="macro-preview__col-label">{amountG} g</span>
      </div>
      <div className="macro-preview__grid">
        {MACRO_CHIPS.map(({ key, label, unit, color }) => (
          <div
            key={key}
            className="macro-chip"
            style={{ "--chip-color": color } as CSSProperties}
          >
            <span className="macro-chip__label">{label}</span>
            <span className="macro-chip__base">
              {Math.round(food[key] * 10) / 10}
              <span className="macro-chip__unit"> {unit}</span>
            </span>
            <span className="macro-chip__value">
              {Math.round(preview[key] * 10) / 10}
              <span className="macro-chip__unit"> {unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
