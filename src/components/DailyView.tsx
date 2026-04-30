import { useState, useEffect, useRef } from "react";
import { useEntries } from "../hooks/useEntries";
import { useSettings } from "../hooks/useSettings";
import { sumMacros } from "../utils/macros";
import MacroSummary from "./MacroSummary";
import EntryList from "./EntryList";
import AddEntryModal from "./AddEntryModal";
import EditEntryModal from "./EditEntryModal";
import Toast from "./Toast";
import type { MealCategory, EntryWithFood } from "../types";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function DailyView() {
  const [date, setDate] = useState<string>(toISODate(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<EntryWithFood | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [burnedKcal, setBurnedKcal] = useState<number>(() => {
    const stored = localStorage.getItem(`burned-kcal-${date}`);
    return stored ? Number(stored) : 0;
  });

  useEffect(() => {
    const stored = localStorage.getItem(`burned-kcal-${date}`);
    setBurnedKcal(stored ? Number(stored) : 0);
  }, [date]);

  const { entries, addEntry, deleteEntry, updateEntry } = useEntries(date);
  const { settings } = useSettings();

  const totals = sumMacros(entries.map((e: EntryWithFood) => e.computed));

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2500);
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

  function handleDelete(id: number) {
    void deleteEntry(id);
  }

  function handleSaveEdit(id: number, meal: MealCategory, amountG: number) {
    void updateEntry(id, meal, amountG);
  }

  function handleBurnedKcalChange(value: number) {
    setBurnedKcal(value);
    localStorage.setItem(`burned-kcal-${date}`, String(value));
  }

  function changeDate(offsetDays: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + offsetDays);
    setDate(toISODate(d));
  }

  return (
    <div className="view">
      <div className="date-nav">
        <button className="btn btn--ghost" onClick={() => changeDate(-1)}>
          ←
        </button>
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
        totals={totals}
        goals={settings}
        burnedKcal={burnedKcal}
        onBurnedKcalChange={handleBurnedKcalChange}
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
        <AddEntryModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}
