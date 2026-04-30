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
