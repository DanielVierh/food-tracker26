import type { Food } from "../types";
import { OFF_API_BASE, OFF_SEARCH_PAGE_SIZE } from "../constants";

// ---------------------------------------------------------------------------
// Shape of a single product from the OFF search endpoint
// (only the fields we actually use)
// ---------------------------------------------------------------------------
interface OffProduct {
  code: string;
  product_name: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface OffSearchResponse {
  products: OffProduct[];
}

// ---------------------------------------------------------------------------
// Map a raw OFF product to our Food interface
// ---------------------------------------------------------------------------
function mapProductToFood(product: OffProduct): Food {
  const n = product.nutriments;
  return {
    name: product.product_name || "Unbekanntes Produkt",
    barcode: product.code || undefined,
    kcal: n["energy-kcal_100g"] ?? 0,
    protein: n["proteins_100g"] ?? 0,
    carbs: n["carbohydrates_100g"] ?? 0,
    fat: n["fat_100g"] ?? 0,
    source: "openfoods",
  };
}

// ---------------------------------------------------------------------------
// Search the OFF API for a query string.
// Returns an empty array when offline or on network errors.
// ---------------------------------------------------------------------------
export async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  const url = new URL(`${OFF_API_BASE}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(OFF_SEARCH_PAGE_SIZE));
  url.searchParams.set("fields", "code,product_name,nutriments");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data: OffSearchResponse =
      (await response.json()) as OffSearchResponse;
    return data.products.filter((p) => p.product_name).map(mapProductToFood);
  } catch {
    // Offline or network error — gracefully return empty
    return [];
  }
}
