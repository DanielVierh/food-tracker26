import Dexie from "dexie";
import type { Table } from "dexie";
import type { BodyMetric, Food, FoodEntry, Settings } from "../types";

// ---------------------------------------------------------------------------
// FoodTrackerDB — single Dexie instance for the whole app.
//
// Version history:
//   1 — initial schema
//   2 — added compound index [foodId+date+meal] for duplicate-entry detection
//   3 — added bodyMetrics store
//
// Upgrade strategy: add a new version() block; never mutate existing ones.
// ---------------------------------------------------------------------------
class FoodTrackerDB extends Dexie {
  foods!: Table<Food>;
  entries!: Table<FoodEntry>;
  settings!: Table<Settings>;
  bodyMetrics!: Table<BodyMetric>;

  constructor() {
    super("FoodTrackerDB");

    this.version(1).stores({
      // Indexed columns only — non-indexed fields are stored automatically.
      foods: "++id, name, barcode, source",
      entries: "++id, foodId, date, meal",
      settings: "id",
    });

    this.version(2).stores({
      // Add compound index for duplicate-entry accumulation lookup
      entries: "++id, foodId, date, meal, [foodId+date+meal]",
    });

    this.version(3).stores({
      bodyMetrics: "++id, date",
    });

    this.version(4).stores({});
  }
}

// Singleton — import this everywhere instead of instantiating multiple times
export const db = new FoodTrackerDB();
