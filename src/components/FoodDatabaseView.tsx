import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Food } from "../types";

type EditDraft = {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  salt: string;
  barcode: string;
  quantityUnit: string;
};

const EMPTY_DRAFT: EditDraft = {
  name: "",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  salt: "",
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
      if (q.length < 1) return db.foods.orderBy("name").toArray();
      return db.foods.filter((f) => f.name.toLowerCase().includes(q)).toArray();
    }, [search]) ?? [];

  function startEdit(food: Food) {
    setEditingId(food.id!);
    setDraft({
      name: food.name,
      kcal: String(food.kcal),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      fiber: String(food.fiber ?? 0),
      sugar: String(food.sugar ?? 0),
      salt: String(food.salt ?? 0),
      barcode: food.barcode ?? "",
      quantityUnit: food.quantityUnit ?? "",
    });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    const savedAt = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    await db.foods.update(editingId, {
      name: draft.name.trim(),
      kcal: Number(draft.kcal),
      protein: Number(draft.protein),
      carbs: Number(draft.carbs),
      fat: Number(draft.fat),
      fiber: Number(draft.fiber),
      sugar: Number(draft.sugar),
      salt: Number(draft.salt),
      barcode: draft.barcode || undefined,
      quantityUnit: draft.quantityUnit || undefined,
      savedAt,
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
          value={draft[key]}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              [key]: e.target.value,
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
                  {food.source === "custom" &&
                    (food.savedAt ?? food.quantityUnit) && (
                      <span className="food-list__badge">
                        {food.savedAt ?? food.quantityUnit}
                      </span>
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
