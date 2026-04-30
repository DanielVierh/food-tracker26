import { useState } from "react";
import MacroPreview from "./MacroPreview";
import type { EntryWithFood, MealCategory } from "../types";
import { MEAL_CATEGORIES, MEAL_CATEGORY_ORDER } from "../constants";

interface EditEntryModalProps {
  entry: EntryWithFood;
  onSave: (id: number, meal: MealCategory, amountG: number) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export default function EditEntryModal({
  entry,
  onSave,
  onDelete,
  onClose,
}: EditEntryModalProps) {
  const [amountG, setAmountG] = useState(entry.amountG);
  const [meal, setMeal] = useState<MealCategory>(entry.meal);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { food } = entry;

  function handleSave() {
    if (entry.id === undefined) return;
    onSave(entry.id, meal, amountG);
    onClose();
  }

  function handleDelete() {
    if (entry.id === undefined) return;
    onDelete(entry.id);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal__close"
          onClick={onClose}
          aria-label="Schließen"
        >
          ✕
        </button>

        <h2 className="modal__title">{food.name}</h2>

        <MacroPreview food={food} amountG={amountG} />

        <label className="form-label">
          Mahlzeit
          <select
            className="input"
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealCategory)}
          >
            {MEAL_CATEGORY_ORDER.map((m) => (
              <option key={m} value={m}>
                {MEAL_CATEGORIES[m]}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Menge (g)
          <input
            className="input"
            type="number"
            min={1}
            value={amountG}
            onChange={(e) => setAmountG(Number(e.target.value))}
          />
        </label>

        <div className="modal__actions">
          {confirmDelete ? (
            <>
              <span className="modal__delete-hint">Wirklich löschen?</span>
              <button
                className="btn btn--ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Abbrechen
              </button>
              <button className="btn btn--danger" onClick={handleDelete}>
                Ja, löschen
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn--danger"
                onClick={() => setConfirmDelete(true)}
              >
                Löschen
              </button>
              <button className="btn btn--primary" onClick={handleSave}>
                Speichern
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
