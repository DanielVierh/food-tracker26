import { useRef, useEffect, useState, type CSSProperties } from "react";
import type { DayData } from "../hooks/useEntries";
import type { Macros } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MACRO_KEYS: (keyof Omit<Macros, "kcal">)[] = [
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "salt",
];

const MACRO_LABELS: Record<string, string> = {
  protein: "Protein",
  carbs: "Kohlenhydrate",
  fat: "Fett",
  fiber: "Ballaststoffe",
  sugar: "Zucker",
  salt: "Salz",
};

const MACRO_COLORS: Record<string, string> = {
  protein: "#10b981",
  carbs: "#3b82f6",
  fat: "#f97316",
  fiber: "#8b5cf6",
  sugar: "#f43f5e",
  salt: "#94a3b8",
};

const PAD = { top: 36, right: 16, bottom: 52, left: 52 };
const CHART_HEIGHT = 220;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (h <= 0) return;
  const radius = Math.min(r, Math.abs(h) / 2, Math.abs(w) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  data: DayData[];
  kcalGoal: number;
  macroGoals: Macros;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MacroHistoryChart({
  data,
  kcalGoal,
  macroGoals,
}: Props) {
  const [tab, setTab] = useState<"kcal" | "macros">("kcal");
  const [activeMacros, setActiveMacros] = useState<Set<string>>(
    new Set(["protein", "carbs", "fat"]),
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function toggleMacro(key: string) {
    setActiveMacros((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // immer mind. 1 aktiv
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const W = canvas.clientWidth;
    const H = CHART_HEIGHT;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const bgColor = getCSSVar("--color-bg") || "#010611";
    const surfaceColor = getCSSVar("--color-surface") || "#052827";
    const textColor = getCSSVar("--color-text-muted") || "#94a3b8";
    const primaryColor = getCSSVar("--color-primary") || "#0b8a31";
    const dangerColor = getCSSVar("--color-danger") || "#ef4444";
    const borderColor = getCSSVar("--color-border") || "#021227";

    // Background
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(0, 0, W, H);

    if (data.length === 0) {
      ctx.fillStyle = textColor;
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Keine Daten vorhanden", W / 2, H / 2);
      return;
    }

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    if (tab === "kcal") {
      drawKcalChart(
        ctx,
        data,
        kcalGoal,
        plotW,
        plotH,
        bgColor,
        primaryColor,
        dangerColor,
        textColor,
        borderColor,
      );
    } else {
      drawMacroChart(
        ctx,
        data,
        macroGoals,
        activeMacros,
        plotW,
        plotH,
        primaryColor,
        textColor,
        borderColor,
      );
    }
  }, [data, tab, activeMacros, kcalGoal, macroGoals]);

  // -------------------------------------------------------------------------
  // Kcal bar chart
  // -------------------------------------------------------------------------
  function drawKcalChart(
    ctx: CanvasRenderingContext2D,
    days: DayData[],
    goal: number,
    plotW: number,
    plotH: number,
    _bgColor: string,
    primaryColor: string,
    dangerColor: string,
    textColor: string,
    borderColor: string,
  ) {
    const maxVal = Math.max(goal * 1.2, ...days.map((d) => d.kcal), 1);
    const n = days.length;
    const barW = Math.max(2, (plotW / n) * 0.65);
    const slotW = plotW / n;

    // Grid
    const gridLines = 4;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.top + plotH - (i / gridLines) * plotH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();

      // Y-label
      const val = Math.round((maxVal * i) / gridLines);
      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${val}`, PAD.left - 5, y + 3);
    }

    // Bars
    for (let i = 0; i < n; i++) {
      const day = days[i];
      const x = PAD.left + i * slotW + (slotW - barW) / 2;
      const barH = (day.kcal / maxVal) * plotH;
      const y = PAD.top + plotH - barH;
      ctx.fillStyle = day.kcal > goal && goal > 0 ? dangerColor : primaryColor;
      roundedRect(ctx, x, y, barW, barH, 3);
      ctx.fill();
    }

    // Goal line
    if (goal > 0) {
      const goalY = PAD.top + plotH - (goal / maxVal) * plotH;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD.left, goalY);
      ctx.lineTo(PAD.left + plotW, goalY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Ziel ${goal}`, PAD.left + 4, goalY - 4);
    }

    // X-labels
    drawXLabels(ctx, days, plotW, plotH, textColor);
  }

  // -------------------------------------------------------------------------
  // Macro line chart (% of goal)
  // -------------------------------------------------------------------------
  function drawMacroChart(
    ctx: CanvasRenderingContext2D,
    days: DayData[],
    goals: Macros,
    active: Set<string>,
    plotW: number,
    plotH: number,
    _primaryColor: string,
    textColor: string,
    borderColor: string,
  ) {
    const maxPct = 150;

    // Grid
    const gridLines = 3; // 0, 50, 100, 150
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const pct = (i / gridLines) * maxPct;
      const y = PAD.top + plotH - (pct / maxPct) * plotH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(pct)}%`, PAD.left - 5, y + 3);
    }

    // 100% dashed line
    const y100 = PAD.top + plotH - (100 / maxPct) * plotH;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y100);
    ctx.lineTo(PAD.left + plotW, y100);
    ctx.stroke();
    ctx.setLineDash([]);

    const n = days.length;
    const slotW = plotW / Math.max(n - 1, 1);

    // Lines per macro
    for (const key of MACRO_KEYS) {
      if (!active.has(key)) continue;
      const goal = goals[key as keyof Macros] as number;
      if (!goal) continue;
      const color = MACRO_COLORS[key];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < n; i++) {
        const val = days[i][key as keyof DayData] as number;
        const pct = (val / goal) * 100;
        const x = PAD.left + (n === 1 ? plotW / 2 : i * slotW);
        const y = PAD.top + plotH - Math.min((pct / maxPct) * plotH, plotH);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Dots
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const val = days[i][key as keyof DayData] as number;
        const pct = (val / goal) * 100;
        const x = PAD.left + (n === 1 ? plotW / 2 : i * slotW);
        const y = PAD.top + plotH - Math.min((pct / maxPct) * plotH, plotH);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawXLabels(ctx, days, plotW, plotH, textColor);
  }

  // -------------------------------------------------------------------------
  // Shared X-axis labels
  // -------------------------------------------------------------------------
  function drawXLabels(
    ctx: CanvasRenderingContext2D,
    days: DayData[],
    plotW: number,
    plotH: number,
    textColor: string,
  ) {
    const n = days.length;
    const slotW = plotW / Math.max(n, 1);
    const maxLabels = 7;
    const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);

    ctx.fillStyle = textColor;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";

    for (let i = 0; i < n; i += step) {
      const x = PAD.left + i * slotW + slotW / 2;
      const y = PAD.top + plotH + 16;
      ctx.fillText(formatDate(days[i].date), x, y);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="macro-history-chart">
      {/* Tabs */}
      <div className="macro-history-chart__tabs">
        <button
          className={`macro-history-chart__tab${tab === "kcal" ? " macro-history-chart__tab--active" : ""}`}
          onClick={() => setTab("kcal")}
        >
          Kalorien
        </button>
        <button
          className={`macro-history-chart__tab${tab === "macros" ? " macro-history-chart__tab--active" : ""}`}
          onClick={() => setTab("macros")}
        >
          Makros
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: CHART_HEIGHT, display: "block" }}
      />

      {/* Macro toggles (only on macros tab) */}
      {tab === "macros" && (
        <div className="macro-history-chart__toggles">
          {MACRO_KEYS.map((key) => (
            <button
              key={key}
              className={`macro-history-chart__toggle${activeMacros.has(key) ? " macro-history-chart__toggle--active" : ""}`}
              style={{ "--toggle-color": MACRO_COLORS[key] } as CSSProperties}
              onClick={() => toggleMacro(key)}
            >
              {MACRO_LABELS[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
