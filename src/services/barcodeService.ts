import { db } from "../db/db";
import { lookupBarcodeOpenFoodFacts } from "./openFoodFacts";
import type { Food } from "../types";

// ---------------------------------------------------------------------------
// lookupBarcode — local-first barcode resolution.
//
// 1. Check IndexedDB by exact barcode match → return immediately (no API call)
// 2. On cache miss → query Open Food Facts API → cache result → return
// ---------------------------------------------------------------------------
export async function lookupBarcode(barcode: string): Promise<Food | null> {
  // 1. Local DB check — no network request if already cached
  const local = await db.foods.where("barcode").equals(barcode).first();
  if (local) return local;

  // 2. API lookup
  const food = await lookupBarcodeOpenFoodFacts(barcode);
  if (!food) return null;

  // Cache for offline use
  const id = await db.foods.add(food);
  return { ...food, id: id as number };
}
