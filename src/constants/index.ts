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
};

// ---------------------------------------------------------------------------
// Open Food Facts API
// ---------------------------------------------------------------------------
export const OFF_API_BASE = "https://world.openfoodfacts.org";

/** How many API results to fetch per search query */
export const OFF_SEARCH_PAGE_SIZE = 20;
