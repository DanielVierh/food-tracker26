import type { CSSProperties } from "react";

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

export default function MacroBar({
  label,
  value,
  goal,
  unit,
  color,
}: MacroBarProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  const barStyle: CSSProperties = {
    width: `${pct}%`,
    backgroundColor: color,
  };

  return (
    <div className="macro-bar">
      <div className="macro-bar__header">
        <span className="macro-bar__label">{label}</span>
        <span className="macro-bar__values">
          {value} / {goal} {unit}
        </span>
      </div>
      <div className="macro-bar__track">
        <div className="macro-bar__fill" style={barStyle} />
      </div>
    </div>
  );
}
