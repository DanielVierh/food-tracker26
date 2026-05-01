import type { Food, Macros } from "../types";

// ---------------------------------------------------------------------------
// Sanitize a macro value: treat NaN, Infinity, null, undefined as 0
// ---------------------------------------------------------------------------
function s(v: number | null | undefined): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Scale macros (per 100 g) to an actual amount in grams
// ---------------------------------------------------------------------------
export function computeMacros(food: Food, amountG: number): Macros {
  const factor = s(amountG) / 100;
  return {
    kcal: round(s(food.kcal) * factor),
    protein: round(s(food.protein) * factor),
    carbs: round(s(food.carbs) * factor),
    fat: round(s(food.fat) * factor),
    fiber: round(s(food.fiber) * factor),
    sugar: round(s(food.sugar) * factor),
    salt: round(s(food.salt) * factor),
  };
}

// ---------------------------------------------------------------------------
// Sum an array of Macros (e.g. all entries of one day)
// ---------------------------------------------------------------------------
export function sumMacros(macros: Macros[]): Macros {
  return macros.reduce<Macros>(
    (acc, m) => ({
      kcal: round(acc.kcal + m.kcal),
      protein: round(acc.protein + m.protein),
      carbs: round(acc.carbs + m.carbs),
      fat: round(acc.fat + m.fat),
      fiber: round(acc.fiber + m.fiber),
      sugar: round(acc.sugar + m.sugar),
      salt: round(acc.salt + m.salt),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 },
  );
}

// ---------------------------------------------------------------------------
// Return progress percentage capped at 100
// ---------------------------------------------------------------------------
export function progressPct(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

// ---------------------------------------------------------------------------
// Internal helper — round to 1 decimal place, guard NaN
// ---------------------------------------------------------------------------
function round(n: number): number {
  const v = Math.round(n * 10) / 10;
  return isFinite(v) ? v : 0;
}
