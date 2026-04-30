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
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
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
    fiber: n["fiber_100g"] ?? 0,
    sugar: n["sugars_100g"] ?? 0,
    salt: n["salt_100g"] ?? 0,
    source: "openfoods",
  };
}

// ---------------------------------------------------------------------------
// Look up a single product by barcode via the OFF product endpoint.
// Returns null when not found, offline, or on errors.
// ---------------------------------------------------------------------------
export async function lookupBarcodeOpenFoodFacts(
  barcode: string,
): Promise<Food | null> {
  const requestUrl = `${OFF_API_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,nutriments`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status: number;
      product?: OffProduct;
    };
    if (data.status !== 1 || !data.product?.product_name) return null;
    return mapProductToFood(data.product);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Search the OFF API for a query string.
// Returns an empty array when offline or on network errors.
// ---------------------------------------------------------------------------
export async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  // v2 REST API — more stable than the legacy /cgi/search.pl endpoint
  const params = new URLSearchParams({
    q: query,
    fields: "code,product_name,nutriments",
    page_size: String(OFF_SEARCH_PAGE_SIZE),
  });
  const requestUrl = `${OFF_API_BASE}/api/v2/search?${params.toString()}`;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) return [];
    const data: OffSearchResponse =
      (await response.json()) as OffSearchResponse;
    return data.products.filter((p) => p.product_name).map(mapProductToFood);
  } catch {
    // Offline or network error — gracefully return empty

    return [];
  }
}
