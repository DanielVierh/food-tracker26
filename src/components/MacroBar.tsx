import type { CSSProperties } from "react";

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

const RADIUS = 42;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

export default function MacroBar({
  label,
  value,
  goal,
  unit,
  color,
}: MacroBarProps) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const dash = pct * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - dash;

  const trackStyle: CSSProperties = { stroke: "var(--color-border)" };
  const fillStyle: CSSProperties = {
    stroke: color,
    strokeDasharray: `${dash} ${gap}`,
    transition: "stroke-dasharray 0.45s ease",
  };

  const displayValue = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);

  return (
    <div className="macro-ring">
      <svg
        className="macro-ring__svg"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          style={trackStyle}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={fillStyle}
        />
        <text
          x="50%"
          y="44%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="macro-ring__value-text"
        >
          {displayValue}
        </text>
        <text
          x="50%"
          y="62%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="macro-ring__unit-text"
        >
          {unit}
        </text>
      </svg>
      <span className="macro-ring__label" style={{ color }}>
        {label}
      </span>
      <span className="macro-ring__goal">
        Ziel: {goal} {unit}
      </span>
    </div>
  );
}
