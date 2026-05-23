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
const MIGRATE_QUANTITY_UNIT_KEY = "food-tracker-migrate-quantityUnit-v1";

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

// ---------------------------------------------------------------------------
// migrateQuantityUnit — one-time backfill: sets quantityUnit on existing DB
// records that were seeded before the field was stored, matched by barcode.
// ---------------------------------------------------------------------------
export async function migrateQuantityUnit(): Promise<void> {
  if (localStorage.getItem(MIGRATE_QUANTITY_UNIT_KEY)) return;

  const barcodeMap = new Map<string, string>();
  for (const r of rawData as SeedRecord[]) {
    if (r.barcode && r.quantityUnit) {
      barcodeMap.set(r.barcode, r.quantityUnit);
    }
  }

  const foods = await db.foods.toArray();
  const updates: { id: number; quantityUnit: string }[] = [];
  for (const food of foods) {
    if (!food.quantityUnit && food.barcode && barcodeMap.has(food.barcode)) {
      updates.push({
        id: food.id!,
        quantityUnit: barcodeMap.get(food.barcode)!,
      });
    }
  }

  await db.transaction("rw", db.foods, async () => {
    for (const u of updates) {
      await db.foods.update(u.id, { quantityUnit: u.quantityUnit });
    }
  });

  localStorage.setItem(MIGRATE_QUANTITY_UNIT_KEY, "1");
}
