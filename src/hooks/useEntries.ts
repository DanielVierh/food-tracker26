import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { computeMacros } from "../utils/macros";
import type { EntryWithFood, MealCategory } from "../types";

// ---------------------------------------------------------------------------
// useEntries — live-queried entries for a given ISO date string ('YYYY-MM-DD')
// ---------------------------------------------------------------------------
export function useEntries(date: string) {
  const rawEntries = useLiveQuery<EntryWithFood[]>(async () => {
    const rawEntries = await db.entries.where("date").equals(date).toArray();

    const enriched = await Promise.all(
      rawEntries.map(async (entry) => {
        const food = await db.foods.get(entry.foodId);
        if (!food) return null;
        return {
          ...entry,
          food,
          computed: computeMacros(food, entry.amountG),
        } satisfies EntryWithFood;
      }),
    );

    return enriched.filter((e): e is EntryWithFood => e !== null);
  }, [date]);
  const entries: EntryWithFood[] = rawEntries ?? [];

  async function addEntry(foodId: number, meal: MealCategory, amountG: number) {
    // If an entry for the same food + meal + date already exists, accumulate the amount
    const existing = await db.entries.where({ foodId, date, meal }).first();

    if (existing?.id !== undefined) {
      await db.entries.update(existing.id, {
        amountG: existing.amountG + amountG,
      });
    } else {
      await db.entries.add({ foodId, date, meal, amountG });
    }
  }

  async function deleteEntry(id: number) {
    await db.entries.delete(id);
  }

  async function updateEntryAmount(id: number, amountG: number) {
    await db.entries.update(id, { amountG });
  }

  async function updateEntry(id: number, meal: MealCategory, amountG: number) {
    await db.entries.update(id, { meal, amountG });
  }

  return {
    entries,
    addEntry,
    deleteEntry,
    updateEntryAmount,
    updateEntry,
  };
}

// ---------------------------------------------------------------------------
// useHistory — returns all distinct logged dates, newest first
// ---------------------------------------------------------------------------
export function useHistory() {
  const rawDates = useLiveQuery<string[]>(async () => {
    const all = await db.entries.orderBy("date").reverse().toArray();
    return [...new Set(all.map((e) => e.date))];
  }, []);
  const dates: string[] = rawDates ?? [];
  return dates;
}

// ---------------------------------------------------------------------------
// useMonthKcal — returns a Map<date, totalKcal> for the given month
// ---------------------------------------------------------------------------
export function useMonthKcal(year: number, month: number): Map<string, number> {
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonthFirst =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, "0")}-01`;

  const data = useLiveQuery(async () => {
    const entries = await db.entries
      .where("date")
      .between(firstDay, nextMonthFirst, true, false)
      .toArray();

    const foodIds = [...new Set(entries.map((e) => e.foodId))];
    const foods = await db.foods.bulkGet(foodIds);
    const foodMap = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));

    const dateMap = new Map<string, number>();
    for (const entry of entries) {
      const food = foodMap.get(entry.foodId);
      if (!food) continue;
      const kcal = (food.kcal / 100) * entry.amountG;
      dateMap.set(entry.date, (dateMap.get(entry.date) ?? 0) + kcal);
    }
    return dateMap;
  }, [year, month]);

  return data ?? new Map();
}

// ---------------------------------------------------------------------------
// DayData — aggregated macros for a single day
// ---------------------------------------------------------------------------
export interface DayData {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  salt: number;
}

// ---------------------------------------------------------------------------
// useHistoryData — per-day macro totals, oldest first, capped at limit
// ---------------------------------------------------------------------------
export function useHistoryData(limit = 60): DayData[] {
  const data = useLiveQuery(async () => {
    const allEntries = await db.entries.orderBy("date").toArray();
    const foodIds = [...new Set(allEntries.map((e) => e.foodId))];
    const foods = await db.foods.bulkGet(foodIds);
    const foodMap = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));

    const byDate = new Map<string, Omit<DayData, "date">>();
    for (const entry of allEntries) {
      const food = foodMap.get(entry.foodId);
      if (!food) continue;
      const f = entry.amountG / 100;
      const cur = byDate.get(entry.date) ?? {
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
      };
      byDate.set(entry.date, {
        kcal: cur.kcal + food.kcal * f,
        protein: cur.protein + food.protein * f,
        carbs: cur.carbs + food.carbs * f,
        fat: cur.fat + food.fat * f,
        fiber: cur.fiber + food.fiber * f,
        sugar: cur.sugar + food.sugar * f,
        salt: cur.salt + food.salt * f,
      });
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([date, m]) => ({ date, ...m }));
  }, [limit]);

  return data ?? [];
}
