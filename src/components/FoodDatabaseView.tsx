import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Food } from "../types";

type EditDraft = Omit<Food, "id" | "source">;

const EMPTY_DRAFT: EditDraft = {
  name: "",
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  salt: 0,
  barcode: "",
  quantityUnit: "",
};

export default function FoodDatabaseView() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft>(EMPTY_DRAFT);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const foods =
    useLiveQuery<Food[]>(() => {
      const q = search.trim().toLowerCase();
      if (q.length < 1)
        return db.foods.orderBy("name").toArray();
      return db.foods
        .filter((f) => f.name.toLowerCase().includes(q))
        .toArray();
    }, [search]) ?? [];

  function startEdit(food: Food) {
    setEditingId(food.id!);
    setDraft({
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber ?? 0,
      sugar: food.sugar ?? 0,
      salt: food.salt ?? 0,
      barcode: food.barcode ?? "",
      quantityUnit: food.quantityUnit ?? "",
    });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    await db.foods.update(editingId, {
      name: draft.name.trim(),
      kcal: draft.kcal,
      protein: draft.protein,
      carbs: draft.carbs,
      fat: draft.fat,
      fiber: draft.fiber,
      sugar: draft.sugar,
      salt: draft.salt,
      barcode: draft.barcode || undefined,
      quantityUnit: draft.quantityUnit || undefined,
    });
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    await db.foods.delete(id);
    setConfirmDeleteId(null);
  }

  function field(
    key: keyof EditDraft,
    label: string,
    type: "text" | "number" = "number",
  ) {
    return (
      <label className="form-label">
        {label}
        <input
          className="input"
          type={type}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "any" : undefined}
          value={draft[key] as string | number}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              [key]: type === "number" ? Number(e.target.value) : e.target.value,
            }))
          }
        />
      </label>
    );
  }

  return (
    <div className="view">
      <h2 className="view__title">Lebensmittel-Datenbank</h2>

      <input
        className="input"
        type="search"
        placeholder="Suchen …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="food-list" style={{ marginTop: "0.75rem" }}>
        {foods.map((food) => (
          <li key={food.id}>
            {editingId === food.id ? (
              <div className="custom-food-form">
                {field("name", "Name", "text")}
                <div className="custom-food-form__row">
                  {field("kcal", "kcal")}
                  {field("protein", "Protein g")}
                  {field("carbs", "Kohlenhydrate g")}
                  {field("fat", "Fett g")}
                  {field("fiber", "Ballaststoffe g")}
                  {field("sugar", "Zucker g")}
                  {field("salt", "Salz g")}
                  {field("barcode", "Barcode", "text")}
                  {field("quantityUnit", "Mengeneinheit", "text")}
                </div>
                <div className="modal__actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Abbrechen
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => void handleSaveEdit()}
                    disabled={!draft.name.trim()}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            ) : (
              <div className="food-list__item food-list__item--manage">
                <div className="food-list__info">
                  <span className="food-list__name">{food.name}</span>
                  <span className="food-list__kcal">{food.kcal} kcal/100g</span>
                  {food.source === "custom" && (
                    <span className="food-list__badge">custom</span>
                  )}
                </div>
                <div className="food-list__actions">
                  <button
                    className="btn btn--icon"
                    aria-label="Bearbeiten"
                    onClick={() => startEdit(food)}
                  >
                    ✏️
                  </button>
                  {confirmDeleteId === food.id ? (
                    <>
                      <button
                        className="btn btn--danger"
                        onClick={() => void handleDelete(food.id!)}
                      >
                        Löschen ✓
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn--icon"
                      aria-label="Löschen"
                      onClick={() => setConfirmDeleteId(food.id!)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
        {foods.length === 0 && (
          <li>
            <p className="modal__hint">Keine Einträge gefunden.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
