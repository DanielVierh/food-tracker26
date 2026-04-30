import type { Food, Macros } from "../types";

// ---------------------------------------------------------------------------
// Scale macros (per 100 g) to an actual amount in grams
// ---------------------------------------------------------------------------
export function computeMacros(food: Food, amountG: number): Macros {
  const factor = amountG / 100;
  return {
    kcal: round(food.kcal * factor),
    protein: round(food.protein * factor),
    carbs: round(food.carbs * factor),
    fat: round(food.fat * factor),
    fiber: round(food.fiber * factor),
    sugar: round(food.sugar * factor),
    salt: round(food.salt * factor),
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
// Internal helper — round to 1 decimal place
// ---------------------------------------------------------------------------
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
