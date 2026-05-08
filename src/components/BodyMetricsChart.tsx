import { useEffect, useRef } from "react";
import type { BodyMetric } from "../types";

interface BodyMetricsChartProps {
  metrics: BodyMetric[];
}

const COLORS = {
  weight: "#3b82f6",
  bodyFat: "#f97316",
  muscle: "#10b981",
};

const PAD = { top: 36, right: 16, bottom: 44, left: 16 };

function normalizeSeries(values: (number | undefined)[]): (number | null)[] {
  const defined = values.filter((v): v is number => v !== undefined);
  if (defined.length < 2)
    return values.map((v) => (v !== undefined ? 0.5 : null));
  const min = Math.min(...defined);
  const max = Math.max(...defined);
  const range = max - min || 1;
  return values.map((v) => (v !== undefined ? 1 - (v - min) / range : null));
}

export default function BodyMetricsChart({ metrics }: BodyMetricsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 200;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const W = cssW;
    const H = cssH;
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);

    const n = metrics.length;

    const xOf = (i: number) =>
      PAD.left + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
    const yOf = (norm: number) => PAD.top + norm * chartH;

    // Horizontal grid lines
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let t = 0; t <= 4; t++) {
      const y = PAD.top + (t / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
    }

    function drawSeries(
      norms: (number | null)[],
      color: string,
      c: CanvasRenderingContext2D,
    ) {
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const norm = norms[i];
        if (norm === null) continue;
        const x = xOf(i);
        const y = yOf(norm);
        if (!started) {
          c.moveTo(x, y);
          started = true;
        } else {
          c.lineTo(x, y);
        }
      }
      c.stroke();

      // Dots
      for (let i = 0; i < n; i++) {
        const norm = norms[i];
        if (norm === null) continue;
        c.fillStyle = color;
        c.beginPath();
        c.arc(xOf(i), yOf(norm), 3.5, 0, Math.PI * 2);
        c.fill();
      }
    }

    const wNorm = normalizeSeries(metrics.map((m) => m.weight));
    const fNorm = normalizeSeries(metrics.map((m) => m.bodyFat));
    const mNorm = normalizeSeries(metrics.map((m) => m.muscleMass));

    drawSeries(wNorm, COLORS.weight, ctx);
    drawSeries(fNorm, COLORS.bodyFat, ctx);
    drawSeries(mNorm, COLORS.muscle, ctx);

    // X-axis date labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${(10 * dpr) / dpr}px system-ui`;
    ctx.textAlign = "center";
    const labelIndices =
      n <= 5
        ? Array.from({ length: n }, (_, i) => i)
        : [0, Math.floor((n - 1) / 2), n - 1];
    for (const i of labelIndices) {
      const label = metrics[i].date.slice(5).replace("-", ".");
      ctx.fillText(label, xOf(i), H - PAD.bottom + 16);
    }

    // Legend
    const legendItems = [
      { label: "Gewicht", color: COLORS.weight },
      { label: "Körperfett%", color: COLORS.bodyFat },
      { label: "Muskel%", color: COLORS.muscle },
    ];
    ctx.textAlign = "left";
    ctx.font = "10px system-ui";
    const legendSpacing = Math.min(90, chartW / 3);
    legendItems.forEach(({ label, color }, i) => {
      const lx = PAD.left + i * legendSpacing;
      const ly = PAD.top - 14;
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 6, 10, 8);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(label, lx + 13, ly);
    });
  }, [metrics]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "200px",
        borderRadius: "8px",
        display: "block",
      }}
    />
  );
}
