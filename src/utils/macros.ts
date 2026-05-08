import type { Food, Macros, ActivityLevel } from "../types";

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

// ---------------------------------------------------------------------------
// PAL (Physical Activity Level) multipliers for TDEE calculation
// ---------------------------------------------------------------------------
export const PAL_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

// ---------------------------------------------------------------------------
// BMR — Mifflin-St Jeor formula
// weight in kg, height in cm, age in years
// ---------------------------------------------------------------------------
export function calcBMR(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female",
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

// ---------------------------------------------------------------------------
// Target kcal — TDEE minus a time-based deficit:
//   deficit = (diff_kg × 7700 kcal) / (goalMonths × 30 days)
//   capped at 1000 kcal/day, floor 1200 kcal
// ---------------------------------------------------------------------------
export function calcTargetKcal(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female",
  activityLevel: ActivityLevel,
  targetWeight: number,
  goalMonths: number,
): number {
  const bmr = calcBMR(weight, height, age, gender);
  const tdee = Math.round(bmr * PAL_FACTORS[activityLevel]);
  const diff = weight - targetWeight;
  if (diff <= 0) return tdee;
  const dailyDeficit = Math.min(
    1000,
    Math.round((diff * 7700) / (goalMonths * 30)),
  );
  return Math.max(1200, tdee - dailyDeficit);
}
