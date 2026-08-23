import { useState, useEffect, useRef } from "react";
import { useEntries } from "../hooks/useEntries";
import { useSettings } from "../hooks/useSettings";
import { useBodyMetrics } from "../hooks/useBodyMetrics";
import { sumMacros } from "../utils/macros";
import { db } from "../db/db";
import MacroSummary from "./MacroSummary";
import EntryList from "./EntryList";
import AddEntryModal from "./AddEntryModal";
import EditEntryModal from "./EditEntryModal";
import { computeMacros } from "../utils/macros";
import Toast from "./Toast";
import type { MealCategory, EntryWithFood, Food } from "../types";

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return midnight.getTime() - now.getTime();
}

export default function DailyView({
  initialDate,
}: { initialDate?: string } = {}) {
  const [date, setDate] = useState<string>(
    initialDate ?? toISODate(new Date()),
  );
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<EntryWithFood | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [burnedKcalState, setBurnedKcalState] = useState<{
    date: string;
    value: number;
  }>(() => {
    const d = toISODate(new Date());
    return {
      date: d,
      value: Number(localStorage.getItem(`burned-kcal-${d}`) ?? "0"),
    };
  });
  const [stepsState, setStepsState] = useState<{
    date: string;
    value: number;
  }>(() => {
    const d = toISODate(new Date());
    return {
      date: d,
      value: Number(localStorage.getItem(`steps-${d}`) ?? "0"),
    };
  });

  // Derive effective values: if state is for a different date, read from localStorage
  const burnedKcal =
    burnedKcalState.date === date
      ? burnedKcalState.value
      : Number(localStorage.getItem(`burned-kcal-${date}`) ?? "0");
  const steps =
    stepsState.date === date
      ? stepsState.value
      : Number(localStorage.getItem(`steps-${date}`) ?? "0");

  // Automatically advance to the next day at midnight
  useEffect(() => {
    const timer = setTimeout(() => {
      setDate(toISODate(new Date()));
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, [date]);

  const { entries, addEntry, deleteEntry, updateEntry } = useEntries(date);
  const { settings } = useSettings();
  const { todayMetric, latestMetric } = useBodyMetrics();

  const totals = sumMacros(entries.map((e: EntryWithFood) => e.computed));

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 4500);
  }

  function handleAdd(
    foodId: number,
    meal: MealCategory,
    amountG: number,
    foodName: string,
  ) {
    void addEntry(foodId, meal, amountG).then(() => {
      showToast(`✓ ${foodName} hinzugefügt`);
    });
  }

  function openEditForScannedFood(food: Food) {
    const amountG = 100;
    const mealFromStorage =
      (localStorage.getItem("last-meal") as MealCategory | null) ?? "breakfast";
    const entry: EntryWithFood = {
      foodId: food.id as number,
      date,
      meal: mealFromStorage,
      amountG,
      food,
      computed: computeMacros(food, amountG),
    };
    setShowModal(false);
    setEditEntry(entry);
  }

  function handleDelete(id: number) {
    void deleteEntry(id);
  }

  function handleSaveEdit(id: number, meal: MealCategory, amountG: number) {
    void updateEntry(id, meal, amountG);
  }

  async function handleAddToTomorrow(
    foodId: number,
    meal: MealCategory,
    amountG: number,
    foodName: string,
  ) {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const tomorrow = toISODate(d);
    const existing = await db.entries
      .where({ foodId, date: tomorrow, meal })
      .first();
    if (existing?.id !== undefined) {
      await db.entries.update(existing.id, {
        amountG: existing.amountG + amountG,
      });
    } else {
      await db.entries.add({ foodId, date: tomorrow, meal, amountG });
    }
    showToast(`✓ ${foodName} für morgen hinzugefügt`);
  }

  function handleBurnedKcalChange(value: number) {
    setBurnedKcalState({ date, value });
    localStorage.setItem(`burned-kcal-${date}`, String(value));
  }

  function handleStepsChange(value: number) {
    setStepsState({ date, value });
    localStorage.setItem(`steps-${date}`, String(value));
    const weight = (todayMetric ?? latestMetric)?.weight ?? 0;

    if (weight > 0) {
      const kcalFromSteps = Math.floor((value * 6.5 * weight) / 10000);
      if (kcalFromSteps > burnedKcal) {
        setBurnedKcalState({ date, value: kcalFromSteps });
        localStorage.setItem(`burned-kcal-${date}`, String(kcalFromSteps));
      }
    }
  }

  function changeDate(offsetDays: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + offsetDays);
    setDate(toISODate(d));
  }

  const weekdayShort = new Date(date + "T00:00:00")
    .toLocaleDateString("de-DE", { weekday: "short" })
    .slice(0, 2);

  return (
    <div className="view">
      <div className="date-nav">
        <button className="btn btn--ghost" onClick={() => changeDate(-1)}>
          ←
        </button>
        <span className="date-nav__weekday">{weekdayShort}</span>
        <input
          className="input date-nav__input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="btn btn--ghost" onClick={() => changeDate(1)}>
          →
        </button>
      </div>

      <MacroSummary
        key={date}
        totals={totals}
        goals={settings}
        burnedKcal={burnedKcal}
        onBurnedKcalChange={handleBurnedKcalChange}
        steps={steps}
        onStepsChange={handleStepsChange}
      />

      <EntryList
        entries={entries}
        onEdit={setEditEntry}
        onDelete={handleDelete}
      />

      <button
        className="btn btn--primary btn--fab"
        onClick={() => setShowModal(true)}
        aria-label="Lebensmittel hinzufügen"
      >
        + Hinzufügen
      </button>

      <Toast message={toastMsg} />

      {showModal && (
        <AddEntryModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          onOpenEditForScannedFood={openEditForScannedFood}
        />
      )}

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          onSave={handleSaveEdit}
          onAddNew={(foodId, meal, amountG, foodName) =>
            void handleAdd(foodId, meal, amountG, foodName)
          }
          onDelete={handleDelete}
          onAddToTomorrow={(foodId, meal, amountG, foodName) =>
            void handleAddToTomorrow(foodId, meal, amountG, foodName)
          }
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}
