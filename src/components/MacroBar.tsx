import type { CSSProperties } from "react";

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  higherIsBetter?: boolean;
}

const RADIUS = 35;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function trafficLightColor(ratio: number, higherIsBetter: boolean): string {
  let t: number;
  if (higherIsBetter) {
    if (ratio >= 1.0) t = 1;
    else if (ratio >= 0.7) t = lerp(0.5, 1, (ratio - 0.7) / 0.3);
    else if (ratio >= 0.4) t = lerp(0, 0.5, (ratio - 0.4) / 0.3);
    else t = 0;
  } else {
    if (ratio <= 0.7) t = 1;
    else if (ratio <= 1.0) t = lerp(0.5, 1, (1.0 - ratio) / 0.3);
    else if (ratio <= 1.3) t = lerp(0, 0.5, (1.3 - ratio) / 0.3);
    else t = 0;
  }
  const hue = t < 0.5 ? lerp(0, 45, t * 2) : lerp(45, 130, (t - 0.5) * 2);
  return `hsl(${Math.round(hue)}, 80%, 50%)`;
}

export default function MacroBar({
  label,
  value,
  goal,
  unit,
  higherIsBetter = false,
}: MacroBarProps) {
  const ratio = goal > 0 ? value / goal : 0;
  const pct = Math.min(1, ratio);
  const color = trafficLightColor(ratio, higherIsBetter);

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
