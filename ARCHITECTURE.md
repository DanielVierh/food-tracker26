# Food Tracker — Architektur & Datenfluss

> Zuletzt aktualisiert: Mai 2026  
> Stack: React 19 · TypeScript · Vite · Dexie 4 (IndexedDB) · PWA

---

## Inhaltsverzeichnis

1. [Tech-Stack](#1-tech-stack)
2. [Verzeichnisstruktur](#2-verzeichnisstruktur)
3. [Datenpersistenz](#3-datenpersistenz)
4. [Typen / Interfaces](#4-typen--interfaces)
5. [Datenbank-Schema](#5-datenbank-schema)
6. [Hooks](#6-hooks)
7. [Services & Utils](#7-services--utils)
8. [Komponenten](#8-komponenten)
9. [Datenfluss-Diagramm](#9-datenfluss-diagramm)
10. [Wichtige Patterns](#10-wichtige-patterns)
11. [Erweiterungspunkte](#11-erweiterungspunkte)

---

## 1. Tech-Stack

| Paket             | Version | Zweck                                |
| ----------------- | ------- | ------------------------------------ |
| React             | 19      | UI-Framework                         |
| TypeScript        | ~6      | Typsicherheit                        |
| Vite              | 6       | Build-Tool, Dev-Server               |
| Dexie             | 4.4.2   | IndexedDB-ORM                        |
| dexie-react-hooks | 1.1.7   | `useLiveQuery` — reaktive DB-Queries |
| @zxing/browser    | —       | Barcode-Scan via Kamera              |

---

## 2. Verzeichnisstruktur

```
src/
├── App.tsx                  # Root — View-Router (activeView-State)
├── App.css                  # Globale Styles (Design-Tokens, alle Klassen)
├── main.tsx                 # React-Mount-Point
├── env.d.ts                 # TS-Deklaration für __APP_VERSION__
│
├── types/index.ts           # Alle geteilten TypeScript-Interfaces
├── constants/index.ts       # DEFAULT_SETTINGS, MEAL_CATEGORIES, OFF-Config
│
├── db/
│   ├── db.ts                # Dexie-Instanz (Singleton) + Schema-Migrationen
│   └── seed.ts              # Optionale Initialdaten
│
├── hooks/
│   ├── useEntries.ts        # Einträge für ein Datum + useHistory()
│   ├── useFoodSearch.ts     # Debounced Suche (lokal + API)
│   ├── useSettings.ts       # Settings-Singleton aus DB
│   └── useBodyMetrics.ts    # Körpermaße + Upsert
│
├── services/
│   ├── barcodeService.ts    # lookupBarcode() — lokal-first
│   └── openFoodFacts.ts     # Open Food Facts API-Wrapper
│
├── utils/
│   └── macros.ts            # Berechnung: computeMacros, sumMacros, BMR, TDEE
│
├── components/
│   ├── Header.tsx           # Nav-Leiste (4 Tabs)
│   ├── DailyView.tsx        # Tagesansicht (Hauptansicht)
│   ├── HistoryView.tsx      # Verlaufsansicht (alle Tage)
│   ├── SettingsView.tsx     # Profil, Körpermaße, Verlaufs-Chart, Ziele
│   ├── FoodDatabaseView.tsx # DB-Browser: Suche, Bearbeiten, Löschen
│   ├── EntryList.tsx        # Mahlzeit-Gruppen mit Kompakt-MacroSummary
│   ├── EntryCard.tsx        # Einzelner Eintrag (klickbar, löschbar)
│   ├── AddEntryModal.tsx    # Produkt suchen/scannen/anlegen + Menge
│   ├── EditEntryModal.tsx   # Menge/Mahlzeit eines Eintrags ändern
│   ├── MacroSummary.tsx     # Makro-Übersicht (full/compact) + kcal-Bilanz
│   ├── MacroBar.tsx         # SVG-Kreisring für einen Makro-Wert (md/sm)
│   ├── MacroPreview.tsx     # Tabelle: 100g vs. gewählte Menge
│   ├── BodyMetricsChart.tsx # Canvas-Verlaufsgraph (Gewicht, KF, Muskeln)
│   ├── BarcodeScanner.tsx   # Kamera-Overlay (@zxing)
│   └── Toast.tsx            # Temporäre Erfolgs-/Fehlermeldung
│
└── assets/
    └── food_db.json         # Lokale Seed-Daten (optional)
```

---

## 3. Datenpersistenz

Die App nutzt **zwei parallele Speichersysteme**:

### 3.1 IndexedDB via Dexie

Reaktiv durch `useLiveQuery` — jede Änderung in der DB triggert automatisch einen Re-Render aller Komponenten, die die entsprechende Query abonniert haben.

| Store         | Inhalt                                                  |
| ------------- | ------------------------------------------------------- |
| `foods`       | Lebensmittel-Datenbank (custom + Open Food Facts Cache) |
| `entries`     | Tageseinträge (foodId, date, meal, amountG)             |
| `settings`    | Singleton-Row (Makroziele + Körperprofil)               |
| `bodyMetrics` | Tägliche Gewichts-/KF-/Muskelmasse-Messungen            |

### 3.2 localStorage

Nicht reaktiv — wird beim Rendern synchron gelesen, beim Ändern geschrieben.

| Schlüssel                | Inhalt                                          |
| ------------------------ | ----------------------------------------------- |
| `burned-kcal-YYYY-MM-DD` | Verbrannte kcal pro Tag                         |
| `steps-YYYY-MM-DD`       | Schrittzahl pro Tag                             |
| `last-meal`              | Zuletzt gewählte Mahlzeit (Vorauswahl im Modal) |

> **Wichtig für Weiterentwicklung:** `burned-kcal` und `steps` könnten bei Bedarf in die `bodyMetrics`-Tabelle migriert werden, um vollständig reaktiv zu sein und im Verlauf angezeigt werden zu können.

---

## 4. Typen / Interfaces

Alle Typen leben in `src/types/index.ts`.

```ts
// Basis-Makros (alles per 100g)
interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  salt: number;
}

// Lebensmittel in der DB
interface Food extends Macros {
  id?: number; // Auto-increment (Dexie)
  name: string;
  barcode?: string; // EAN-13
  quantityUnit?: string; // z.B. "Stück", "ml"
  source: "custom" | "openfoods";
}

// Geloggter Eintrag pro Tag
interface FoodEntry {
  id?: number;
  foodId: number;
  date: string; // 'YYYY-MM-DD'
  meal: MealCategory;
  amountG: number;
}

// FoodEntry angereichert mit Food-Daten + berechneten Makros
interface EntryWithFood extends FoodEntry {
  food: Food;
  computed: Macros; // computeMacros(food, amountG)
}

// Singleton-Settings-Row (id = 1)
interface Settings extends Macros {
  id: 1;
  age?: number;
  gender?: "male" | "female";
  height?: number; // cm
  targetWeight?: number; // kg
  activityLevel?: ActivityLevel;
  goalMonths?: number; // Zeitraum für Gewichtsziel
}

// Körpermaß-Eintrag pro Tag
interface BodyMetric {
  id?: number;
  date: string;
  weight: number;
  bodyFat?: number; // Prozent
  muscleMass?: number; // Prozent
}

type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
type View = "daily" | "history" | "foods" | "settings";
```

---

## 5. Datenbank-Schema

```
FoodTrackerDB (Dexie, Version 3)
│
├── foods        ++id, name, barcode, source
├── entries      ++id, foodId, date, meal, [foodId+date+meal]
│                                           ↑
│                       Compound-Index für Duplikat-Erkennung
├── settings     id  (Singleton: id=1)
└── bodyMetrics  ++id, date
```

**Migrations-Strategie:** Jede Schemaänderung bekommt einen neuen `version(n).stores({})`-Block in `db.ts`. Bestehende Blöcke werden **nie** verändert — Dexie führt Upgrades automatisch durch.

---

## 6. Hooks

### `useEntries(date: string)`

**Datei:** `hooks/useEntries.ts`

```ts
// Gibt zurück:
{
  entries: EntryWithFood[],  // reaktiv — auto-aktualisiert
  addEntry(foodId, meal, amountG): Promise<void>,
  deleteEntry(id): Promise<void>,
  updateEntry(id, meal, amountG): Promise<void>,
  updateEntryAmount(id, amountG): Promise<void>,
}
```

- Joined automatisch `entries` mit `foods` und berechnet `computed: Macros` via `computeMacros()`
- `addEntry`: akkumuliert Menge, wenn food+meal+date bereits existiert (kein Duplikat-Eintrag)
- Wird von `DailyView` und `DaySummary` (HistoryView) konsumiert

---

### `useHistory()`

**Datei:** `hooks/useEntries.ts` (unten)

```ts
// Gibt zurück:
string[]  // alle Tage mit Einträgen, neueste zuerst
```

- Konsumiert von `HistoryView`

---

### `useSettings()`

**Datei:** `hooks/useSettings.ts`

```ts
{
  settings: Settings,
  updateSettings(partial: Partial<Settings>): Promise<void>,
}
```

- Liest Singleton-Row (id=1); falls nicht vorhanden → `DEFAULT_SETTINGS`
- `updateSettings` mergt partiell: liest aktuellen Stand, merged, schreibt zurück
- Konsumiert von: `DailyView`, `EntryList`, `DaySummary`, `SettingsView`

---

### `useBodyMetrics()`

**Datei:** `hooks/useBodyMetrics.ts`

```ts
{
  metrics: BodyMetric[],     // alle Einträge, nach Datum sortiert
  todayMetric: BodyMetric | undefined,
  addOrUpdateMetric(date, weight, bodyFat?, muscleMass?): Promise<void>,
}
```

- Upsert-Logik: prüft ob Eintrag für `date` existiert, updated oder added
- `todayMetric` wird in `DailyView` für die Schritte→kcal-Berechnung genutzt
- Konsumiert von: `DailyView`, `SettingsView`

---

### `useFoodSearch()`

**Datei:** `hooks/useFoodSearch.ts`

```ts
{
  query: string,
  setQuery(q: string): void,
  results: Food[],
  isLoading: boolean,
  addCustomFood(food: Omit<Food, "id"|"source">): Promise<Food>,
}
```

- **Strategie:** lokal-first → API-Fallback
  1. IndexedDB-Suche (instant, offline-fähig)
  2. Falls < 5 lokale Treffer UND query ≥ 4 Zeichen → Open Food Facts API
  3. API-Ergebnisse werden in IndexedDB gecacht
- Debounce: 600ms
- Konsumiert von: `AddEntryModal`

---

## 7. Services & Utils

### `barcodeService.ts` — `lookupBarcode(barcode: string)`

```
Eingabe: EAN-Barcode (string)
Ausgabe: Food | null

Ablauf:
1. Suche in db.foods nach barcode (lokal, kein Netzwerk)
2. Cache-Miss → lookupBarcodeOpenFoodFacts(barcode)
3. Ergebnis in IndexedDB speichern (source: "openfoods")
4. Food mit id zurückgeben
```

### `openFoodFacts.ts`

- `searchOpenFoodFacts(query)` → `Food[]`
- `lookupBarcodeOpenFoodFacts(barcode)` → `Food | null`
- Beide Funktionen mappen die OFF-API-Antwort auf das interne `Food`-Interface

### `utils/macros.ts`

| Funktion                               | Beschreibung                                                      |
| -------------------------------------- | ----------------------------------------------------------------- |
| `computeMacros(food, amountG)`         | Skaliert per-100g-Werte auf tatsächliche Menge                    |
| `sumMacros(macros[])`                  | Summiert ein Array von Macros-Objekten                            |
| `progressPct(value, goal)`             | 0–100, gedeckelt                                                  |
| `calcBMR(weight, height, age, gender)` | Mifflin-St-Jeor-Formel                                            |
| `calcTargetKcal(...)`                  | TDEE - zeitbasiertes Defizit (max 1000 kcal/Tag, min 1200)        |
| `PAL_FACTORS`                          | `{ sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }` |

**kcal-Zielformel:**

```
TDEE = BMR × PAL
Defizit = min(1000, (Δkg × 7700) / (Monate × 30))
Ziel = max(1200, TDEE - Defizit)
```

---

## 8. Komponenten

### `App.tsx`

```
State:  activeView: View  ("daily" | "history" | "foods" | "settings")
Render: <Header> + VIEW_MAP[activeView]
```

Kein eigenes State außer der aktiven View. Alle Views werden bereits instanziiert im `VIEW_MAP`-Objekt (React cached sie nicht — bei Tab-Wechsel wird neu gemountet).

---

### `Header.tsx`

```
Props: activeView, onNavigate(view)
```

Statische Nav-Items: Heute, Verlauf, 🗄️ (Datenbank), ⚙️ (Einstellungen-Icon als SVG).

---

### `DailyView.tsx` ★ Kern-Komponente

```
State (lokal):
  date: string                     ← YYYY-MM-DD, initial = heute
  burnedKcalState: {date, value}   ← aus localStorage, kein useEffect
  stepsState:      {date, value}   ← aus localStorage, kein useEffect

Hooks:
  useEntries(date)    → entries, addEntry, deleteEntry, updateEntry
  useSettings()       → settings
  useBodyMetrics()    → todayMetric (Gewicht für Schritte-Berechnung)

Berechnungen:
  totals = sumMacros(entries.map(e => e.computed))
  burnedKcal = burnedKcalState.date === date
                 ? burnedKcalState.value
                 : Number(localStorage.getItem(`burned-kcal-${date}`))
  steps = analog

Schritte → kcal:
  kcalFromSteps = floor((steps × 6.5 × weight) / 10000)
  if (kcalFromSteps > burnedKcal) → burnedKcal aktualisieren

Kinder-Komponenten:
  <MacroSummary>   ← totals, settings, burnedKcal, steps
  <EntryList>      ← entries, onEdit, onDelete
  <AddEntryModal>  ← onAdd, onClose  (bedingt)
  <EditEntryModal> ← entry, onSave, onClose  (bedingt)
  <Toast>          ← message
```

---

### `MacroSummary.tsx` — Shared Component

```
Props:
  totals: Macros
  goals: Macros (Settings)
  burnedKcal?: number
  onBurnedKcalChange?: (v: number) => void
  steps?: number
  onStepsChange?: (v: number) => void
  variant?: "full" | "compact"   default: "full"

variant="full":
  - MacroBar für Kalorien (groß)
  - kcal-Stats: 🔥 Verbrannt (editierbar), 👟 Schritte (editierbar), ⚖️ Bilanz
  - Bilanz-Formel: Ziel - gegessen + verbrannt
  - Grid mit 6 Makro-Ringen (Protein, Fett, KH, Zucker, Ballaststoffe, Salz)

variant="compact":
  - 3 kleine Ringe (kcal, Protein, KH)
  - Kein Hintergrund, kein Verbrannt-Feld
  - Genutzt in EntryList pro Mahlzeitengruppe
```

---

### `MacroBar.tsx`

```
Props:
  label, value, goal, unit
  higherIsBetter?: boolean   (Protein/Ballaststoffe = true, rest = false)
  size?: "md" | "sm"

size="md": radius=35, stroke=10
size="sm": radius=20, stroke=6

Farbe: Traffic-Light via HSL-Interpolation (0°=rot → 45°=orange → 130°=grün)
  higherIsBetter=true:  grün wenn ≥100%, rot wenn <40%
  higherIsBetter=false: grün wenn ≤70%, rot wenn >130%
```

---

### `EntryList.tsx`

```
Props: entries, onEdit, onDelete

Gruppiert entries nach MealCategory (breakfast/lunch/dinner/snack).
Pro Gruppe:
  <h3> Mahlzeitenname
  <MacroSummary variant="compact" totals=sumMacros(gruppe) goals=settings>
  {gruppe.map(e => <EntryCard entry={e} onEdit onDelete>)}
```

---

### `EntryCard.tsx`

```
Props: entry, onEdit, onDelete

- Zeigt Name, Menge (g), kcal, Protein, KH, Fett
- Klick → onEdit(entry)
- Löschen: 2-Stufen-Bestätigung (lokaler confirming-State)
- Kein eigener DB-Zugriff — alles via Props
```

---

### `AddEntryModal.tsx`

```
State (lokal):
  step: "search" | "amount"
  selectedFood: Food | null
  meal: MealCategory
  amountG: number
  scannerOpen, scanError
  showCustomForm, customName, customKcal, ...
  savedToCustom: boolean

Hooks: useFoodSearch()
Direkter DB-Zugriff: db.foods.update(id, {source:"custom"})
                     ↑ für "💾 Speichern"-Button bei gescannten Produkten

Schritt "search":
  - Suchfeld → useFoodSearch
  - Barcode-Button → BarcodeScanner → lookupBarcode()
  - Ergebnisliste → handleSelectFood(food) → step="amount"
  - Custom-Formular: alle Felder mit step="any", addCustomFood()

Schritt "amount":
  - MacroPreview (live-update beim Ändern der Menge)
  - Mahlzeit-Select
  - Menge-Input
  - 💾 Speichern (nur wenn source="openfoods" && !savedToCustom)
  - Hinzufügen → onAdd(foodId, meal, amountG, name) → onClose()
```

---

### `SettingsView.tsx`

```
Hooks: useSettings(), useBodyMetrics()

4 Sektionen:
  A) Körperprofil     → age, gender, height, targetWeight, activityLevel, goalMonths
  B) Heutiger Eintrag → weight, bodyFat, muscleMass + Live-kcal-Hint
  C) Verlauf          → BodyMetricsChart (immer sichtbar)
  D) Manuelle Ziele   → alle 7 Makro-Ziele direkt editierbar

Pattern: Null-Draft (siehe §10)
  profileDraft, metricDraft, goalsDraft: null | {...}
  Angezeigter Wert = draft ?? liveDB-Wert

Auto-Update:
  Beim Speichern von Abschnitt B (Gewicht) wird settings.kcal
  automatisch auf calcTargetKcal(...) gesetzt, wenn alle Profil-
  felder vorhanden sind.
```

---

### `BodyMetricsChart.tsx`

```
Props: metrics: BodyMetric[]

Native HTML5 Canvas (kein Chart-Framework).
DPR-aware (window.devicePixelRatio).
3 Serien: Gewicht (blau), Körperfett (orange), Muskeln (grün)
Normalisierung: per-Serie min/max auf 0–1
X-Achse: 3 Datumspunkte (erste, mittlere, letzte Messung)
Legende oben links
Kompatibilität: fillRect statt roundRect (Safari PWA)
```

---

### `FoodDatabaseView.tsx`

```
State (lokal): search, editingId, draft: EditDraft, confirmDeleteId

DB-Zugriff direkt via db.foods (useLiveQuery + update/delete)

Funktionen:
  - Live-Suche (useLiveQuery mit search-Dep)
  - Inline-Edit-Formular (alle Felder inkl. Barcode, Mengeneinheit)
  - 2-Stufen-Löschen (confirmDeleteId)
  - Badge "custom" für eigene Produkte
```

---

### `BarcodeScanner.tsx`

```
Props: onDetected(barcode), onClose()

Nutzt @zxing/browser BrowserMultiFormatReader.
Kamera-Stream auf <video>-Element.
Feuert onDetected einmalig beim ersten erkannten Barcode.
Cleanup via IScannerControls.stop() im useEffect-Cleanup.
```

---

## 9. Datenfluss-Diagramm

```
IndexedDB                localStorage
  foods ─────────────────────────────────────────┐
  entries ──┐                                    │
  settings ─┼──► Hooks ──► Components            │
  metrics ──┘    │                               │
                 │   useEntries     ──► DailyView ◄── burned-kcal-*
                 │   useSettings    ──► DailyView     steps-*
                 │   useBodyMetrics ──► DailyView
                 │   useFoodSearch  ──► AddEntryModal
                 │   useHistory     ──► HistoryView
                 │
                 └── DailyView ──► MacroSummary (full, mit Steps-Input)
                               ──► EntryList ──► EntryCard
                                            └──► MacroSummary (compact)
                               ──► AddEntryModal
                               ──► EditEntryModal

  HistoryView ──► DaySummary(date) ──► useEntries(date)  [eigene Instanz!]
                                   ──► MacroSummary (readOnly)

  SettingsView ──► useSettings + useBodyMetrics
               ──► calcTargetKcal() [macros.ts]
               ──► BodyMetricsChart [Canvas]

  FoodDatabaseView ──► db.foods direkt (useLiveQuery + CRUD)

  Open Food Facts API ──► barcodeService / openFoodFacts
                      ──► db.foods (Cache-Write)
```

---

## 10. Wichtige Patterns

### Null-Draft-Pattern (SettingsView)

Problem: `useState(asyncData)` funktioniert nicht, weil `useLiveQuery` async ist. `useEffect + setState` löst einen Lint-Fehler aus (cascading renders).

Lösung:

```ts
const [draft, setDraft] = useState<MyDraft | null>(null);

const value = useMemo(
  () => draft ?? {
    field: liveData.field ?? defaultValue,
  },
  [draft, liveData]
);

// Bei erstem Edit:
onChange={(e) => setDraft(p => ({ ...(p ?? value), field: e.target.value }))}
```

### `{date, value}`-State-Pattern (DailyView)

Problem: `burnedKcal` und `steps` kommen aus localStorage, variieren pro Datum. `useEffect + setState` für Datumswechsel = Lint-Fehler.

Lösung: State speichert `{date, value}`. Beim Lesen: falls `state.date !== currentDate` → direkt aus localStorage lesen.

```ts
const burnedKcal =
  burnedKcalState.date === date
    ? burnedKcalState.value
    : Number(localStorage.getItem(`burned-kcal-${date}`) ?? "0");
```

### Lokal-First bei API-Calls

`barcodeService.lookupBarcode()` und `useFoodSearch` prüfen immer zuerst IndexedDB. API wird nur bei Cache-Miss gerufen. Ergebnisse werden sofort gecacht → App funktioniert nach ersten Starts auch offline.

### Reagieren auf DB-Änderungen

Alle Hooks nutzen `useLiveQuery` — Dexie observiert die abonnierten Tabellen und triggert automatisch Re-Renders wenn sich Daten ändern. Kein manuelles Invalidieren nötig.

---

## 11. Erweiterungspunkte

### Kurzfristig möglich

| Feature                                     | Ansatz                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `burned-kcal` + `steps` in Verlauf anzeigen | In `bodyMetrics` migrieren (neue Felder `burnedKcal`, `steps`)      |
| Mehrere Einheiten (Stück, ml)               | `quantityUnit`-Feld ist vorbereitet; UI in `AddEntryModal` ausbauen |
| Favoriten-Lebensmittel                      | Boolean-Flag `favorite` in `Food`, Filter in `useFoodSearch`        |
| Export (CSV/JSON)                           | `db.foods.toArray()`, `db.entries.toArray()` → Blob-Download        |
| Mahlzeitenvorlagen                          | Neue Tabelle `templates`, Einträge kopieren via `addEntry`          |

### Mittelfristig

| Feature                     | Ansatz                                                      |
| --------------------------- | ----------------------------------------------------------- |
| Nährwert-Ziele pro Mahlzeit | `Settings` um `mealGoals` erweitern                         |
| Wasser-Tracking             | Neues Store in DB v4                                        |
| Widget / Push-Notifications | Service Worker ausbauen (PWA-Manifest vorhanden)            |
| Cloud-Sync                  | Dexie Cloud Add-On (kompatibel mit bestehendem Dexie-Setup) |

### Bekannte Limitierungen

- `HistoryView` instanziiert für jeden sichtbaren Tag eine eigene `useEntries`-Query — bei vielen Tagen könnte das Performance-Probleme verursachen. Lösung: Virtualisierung oder `useHistory`-Hook um `sumMacros` erweitern.
- `DaySummary` liest `burned-kcal-*` synchron aus localStorage — nicht reaktiv. Änderungen am aktuellen Tag werden erst beim nächsten Render von HistoryView sichtbar.
- MacroSummary-`variant="compact"` teilt die Ziele durch 4 (`goals[key] / 4`) als Näherung für Mahlzeitenziel — kein echtes Mahlzeiten-Ziel-Feature.
