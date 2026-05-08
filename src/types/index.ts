// ---------------------------------------------------------------------------
// Primitive nutrition values — base for Food and Settings
// ---------------------------------------------------------------------------
export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  salt: number;
}

// ---------------------------------------------------------------------------
// Food — a product in the local database (cached from API or created manually)
// ---------------------------------------------------------------------------
export type FoodSource = "custom" | "openfoods";

export interface Food extends Macros {
  /** Auto-incremented primary key (Dexie sets this on insert) */
  id?: number;
  name: string;
  /** EAN barcode, if available from Open Food Facts */
  barcode?: string;
  /** Serving unit label from the product data (e.g. "Stück", "ml") */
  quantityUnit?: string;
  /** All macro values are per 100 g */
  source: FoodSource;
}

// ---------------------------------------------------------------------------
// Meal categories
// ---------------------------------------------------------------------------
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

// ---------------------------------------------------------------------------
// FoodEntry — a logged portion for a specific day
// ---------------------------------------------------------------------------
export interface FoodEntry {
  /** Auto-incremented primary key */
  id?: number;
  foodId: number;
  /** ISO date string: 'YYYY-MM-DD' */
  date: string;
  meal: MealCategory;
  /** Amount in grams */
  amountG: number;
}

// ---------------------------------------------------------------------------
// EntryWithFood — FoodEntry joined with its Food + computed macros for the
// actual amount (not per 100 g)
// ---------------------------------------------------------------------------
export interface EntryWithFood extends FoodEntry {
  food: Food;
  computed: Macros;
}

// ---------------------------------------------------------------------------
// Settings — singleton row (id always 1)
// ---------------------------------------------------------------------------
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export interface Settings extends Macros {
  /** Always 1 — enforces singleton pattern in Dexie */
  id: 1;
  // Body profile for TDEE calculation
  age?: number;
  gender?: "male" | "female";
  /** Body height in cm */
  height?: number;
  /** Target body weight in kg */
  targetWeight?: number;
  activityLevel?: ActivityLevel;
}

// ---------------------------------------------------------------------------
// BodyMetric — one measurement entry per day
// ---------------------------------------------------------------------------
export interface BodyMetric {
  id?: number;
  /** ISO date string: 'YYYY-MM-DD' */
  date: string;
  /** Body weight in kg */
  weight: number;
  /** Body fat percentage (optional) */
  bodyFat?: number;
  /** Muscle mass percentage (optional) */
  muscleMass?: number;
}

// ---------------------------------------------------------------------------
// View — top-level navigation state (replaces a router)
// ---------------------------------------------------------------------------
export type View = "daily" | "history" | "settings";
