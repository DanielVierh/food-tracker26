import { useState } from "react";
import { computeMacros } from "../utils/macros";
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

  const preview = computeMacros(entry.food, amountG);
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

        <table className="edit-modal__table">
          <thead>
            <tr>
              <th>Nährstoff</th>
              <th>pro 100 g</th>
              <th>für {amountG} g</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Kalorien</td>
              <td>{food.kcal} kcal</td>
              <td>{preview.kcal} kcal</td>
            </tr>
            <tr>
              <td>Protein</td>
              <td>{food.protein} g</td>
              <td>{preview.protein} g</td>
            </tr>
            <tr>
              <td>Kohlenhydrate</td>
              <td>{food.carbs} g</td>
              <td>{preview.carbs} g</td>
            </tr>
            <tr>
              <td>Fett</td>
              <td>{food.fat} g</td>
              <td>{preview.fat} g</td>
            </tr>
            <tr>
              <td>Ballaststoffe</td>
              <td>{food.fiber} g</td>
              <td>{preview.fiber} g</td>
            </tr>
            <tr>
              <td>Zucker</td>
              <td>{food.sugar} g</td>
              <td>{preview.sugar} g</td>
            </tr>
            <tr>
              <td>Salz</td>
              <td>{food.salt} g</td>
              <td>{preview.salt} g</td>
            </tr>
          </tbody>
        </table>

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
          <button className="btn btn--danger" onClick={handleDelete}>
            Löschen
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
