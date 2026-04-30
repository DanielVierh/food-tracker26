import type { MealCategory, Settings } from "../types";

// ---------------------------------------------------------------------------
// Meal categories — ordered for display
// ---------------------------------------------------------------------------
export const MEAL_CATEGORIES: Record<MealCategory, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

export const MEAL_CATEGORY_ORDER: MealCategory[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

// ---------------------------------------------------------------------------
// Default daily goals
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  kcal: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  fiber: 30,
  sugar: 50,
  salt: 6,
};

// ---------------------------------------------------------------------------
// Open Food Facts API
// In dev, requests go through Vite's proxy (/api/off) to avoid CORS.
// In production the PWA fetches the real URL directly.
// ---------------------------------------------------------------------------
export const OFF_API_BASE = import.meta.env.DEV
  ? "/api/off"
  : "https://world.openfoodfacts.org";

/** How many API results to fetch per search query */
export const OFF_SEARCH_PAGE_SIZE = 20;
