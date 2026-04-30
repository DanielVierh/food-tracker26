import { db } from "./db";
import type { Food } from "../types";
import rawData from "../assets/food_db.json";

// ---------------------------------------------------------------------------
// Shape of a record in food_db.json
// ---------------------------------------------------------------------------
interface SeedRecord {
  productName: string;
  kcal: number;
  fat: number;
  carbs: number;
  sugar: number;
  protein: number;
  salt: number;
  fiber: number;
  barcode: string;
  quantityUnit?: string;
}

const SEED_KEY = "food-tracker-seeded-v1";

// ---------------------------------------------------------------------------
// seedDB — runs exactly once per device (guarded by localStorage flag).
// Using a flag instead of count() ensures the seed also runs when the user
// already has manually added foods but the db data has not been imported yet.
// ---------------------------------------------------------------------------
export async function seedDB(): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return;

  const foods: Omit<Food, "id">[] = (rawData as SeedRecord[])
    .filter((r) => r.productName.trim().length > 0)
    .map((r) => ({
      name: r.productName.trim(),
      kcal: r.kcal,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      fiber: r.fiber,
      sugar: r.sugar,
      salt: r.salt,
      barcode: r.barcode || undefined,
      quantityUnit: r.quantityUnit || undefined,
      source: "custom" as const,
    }));

  await db.foods.bulkAdd(foods);
  localStorage.setItem(SEED_KEY, "1");
}
