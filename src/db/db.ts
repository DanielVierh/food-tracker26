import Dexie from "dexie";
import type { Table } from "dexie";
import type { Food, FoodEntry, Settings } from "../types";

// ---------------------------------------------------------------------------
// FoodTrackerDB — single Dexie instance for the whole app.
//
// Version history:
//   1 — initial schema
//
// Upgrade strategy: add a new version() block; never mutate existing ones.
// ---------------------------------------------------------------------------
class FoodTrackerDB extends Dexie {
  foods!: Table<Food>;
  entries!: Table<FoodEntry>;
  settings!: Table<Settings>;

  constructor() {
    super("FoodTrackerDB");

    this.version(1).stores({
      // Indexed columns only — non-indexed fields are stored automatically.
      foods: "++id, name, barcode, source",
      entries: "++id, foodId, date, meal",
      settings: "id",
    });
  }
}

// Singleton — import this everywhere instead of instantiating multiple times
export const db = new FoodTrackerDB();
