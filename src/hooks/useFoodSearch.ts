import { useState, useEffect, useRef } from "react";
import { db } from "../db/db";
import type { Food } from "../types";

const DEBOUNCE_MS = 600;
// Minimum query length before hitting the OFF API — reduces rate-limit 503s

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
    } finally {
      setIsLoading(false);
    }
  }

  async function addCustomFood(
    food: Omit<Food, "id" | "source">,
  ): Promise<Food> {
    const savedAt = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const id = await db.foods.add({ ...food, source: "custom", savedAt });
    return { ...food, source: "custom", savedAt, id: id as number };
  }

  return { query, setQuery, results, isLoading, addCustomFood };
}
