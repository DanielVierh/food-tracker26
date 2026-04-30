import { useState, useEffect, useRef } from "react";
import { db } from "../db/db";
import { searchOpenFoodFacts } from "../services/openFoodFacts";
import type { Food } from "../types";

const DEBOUNCE_MS = 600;
// Minimum query length before hitting the OFF API — reduces rate-limit 503s
const OFF_MIN_LENGTH = 4;

// ---------------------------------------------------------------------------
// useFoodSearch — debounced, local-first search.
//
// Strategy:
//   1. Always search local IndexedDB first (instant, works offline).
//   2. If online and local results < threshold, also query Open Food Facts.
//   3. Cache every API result in IndexedDB so it's available offline later.
// ---------------------------------------------------------------------------
export function useFoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void search(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function search(q: string) {
    setIsLoading(true);
    try {
      // 1. Local results — no limit, return everything from IndexedDB
      const local = await db.foods
        .filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
        .toArray();

      setResults(local);

      // 2. API fallback when few local hits and query is long enough
      if (local.length < 5 && q.length >= OFF_MIN_LENGTH) {
        const apiResults = await searchOpenFoodFacts(q);

        if (apiResults.length > 0) {
          // Cache in IndexedDB (ignore duplicates by barcode / name)
          await Promise.all(apiResults.map((food) => cacheFood(food)));

          // Re-query local DB so UI shows both cached + existing
          const updated = await db.foods
            .filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
            .toArray();

          setResults(updated);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function addCustomFood(
    food: Omit<Food, "id" | "source">,
  ): Promise<Food> {
    const id = await db.foods.add({ ...food, source: "custom" });
    return { ...food, source: "custom", id: id as number };
  }

  return { query, setQuery, results, isLoading, addCustomFood };
}

// ---------------------------------------------------------------------------
// Store a food from the API — skip if an identical barcode already exists
// ---------------------------------------------------------------------------
async function cacheFood(food: Food): Promise<void> {
  if (food.barcode) {
    const existing = await db.foods
      .where("barcode")
      .equals(food.barcode)
      .first();
    if (existing) return;
  }
  await db.foods.add(food);
}
