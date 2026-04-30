import type { Macros } from "../types";
import MacroBar from "./MacroBar";

interface MacroSummaryProps {
  totals: Macros;
  goals: Macros;
}

const MACRO_CONFIG = [
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

export default function MacroSummary({ totals, goals }: MacroSummaryProps) {
  return (
    <div className="macro-summary">
      {MACRO_CONFIG.map(({ key, label, unit, color }) => (
        <MacroBar
          key={key}
          label={label}
          value={totals[key]}
          goal={goals[key]}
          unit={unit}
          color={color}
        />
      ))}
    </div>
  );
}
