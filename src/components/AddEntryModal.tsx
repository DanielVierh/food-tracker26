import { useState } from "react";
import { useFoodSearch } from "../hooks/useFoodSearch";
import { lookupBarcode } from "../services/barcodeService";
import BarcodeScanner from "./BarcodeScanner";
import { MEAL_CATEGORIES, MEAL_CATEGORY_ORDER } from "../constants";
import type { Food, MealCategory } from "../types";

interface AddEntryModalProps {
  onAdd: (foodId: number, meal: MealCategory, amountG: number) => void;
  onClose: () => void;
}

type Step = "search" | "amount";

export default function AddEntryModal({ onAdd, onClose }: AddEntryModalProps) {
  const { query, setQuery, results, isLoading, addCustomFood } =
    useFoodSearch();

  const [step, setStep] = useState<Step>("search");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [meal, setMeal] = useState<MealCategory>("breakfast");
  const [amountG, setAmountG] = useState(100);

  async function handleBarcodeDetected(barcode: string) {
    setScannerOpen(false);
    setScanError("");
    const food = await lookupBarcode(barcode);
    if (food) {
      handleSelectFood(food);
    } else {
      setScanError(`Produkt für Barcode ${barcode} nicht gefunden.`);
    }
  }

  // --- Custom food form state ---
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");

  // --- Custom food form state ---
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState(0);
  const [customProtein, setCustomProtein] = useState(0);
  const [customCarbs, setCustomCarbs] = useState(0);
  const [customFat, setCustomFat] = useState(0);
  const [customFiber, setCustomFiber] = useState(0);
  const [customSugar, setCustomSugar] = useState(0);
  const [customSalt, setCustomSalt] = useState(0);

  function handleSelectFood(food: Food) {
    setSelectedFood(food);
    setStep("amount");
  }

  function handleConfirm() {
    if (!selectedFood?.id) return;
    onAdd(selectedFood.id, meal, amountG);
    onClose();
  }

  async function handleAddCustomFood() {
    if (!customName.trim()) return;
    const food = await addCustomFood({
      name: customName.trim(),
      kcal: customKcal,
      protein: customProtein,
      carbs: customCarbs,
      fat: customFat,
      fiber: customFiber,
      sugar: customSugar,
      salt: customSalt,
    });
    handleSelectFood(food);
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

        {step === "search" && (
          <>
            <h2 className="modal__title">Lebensmittel suchen</h2>

            <div className="modal__search-row">
              <input
                className="input"
                type="search"
                placeholder="z.B. Haferflocken, Banane …"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button
                className="btn btn--icon"
                onClick={() => {
                  setScannerOpen(true);
                  setScanError("");
                }}
                aria-label="Barcode scannen"
                title="Barcode scannen"
              >
                📷
              </button>
            </div>

            {scanError && <p className="modal__error">{scanError}</p>}

            {scannerOpen && (
              <BarcodeScanner
                onDetected={(bc) => void handleBarcodeDetected(bc)}
                onClose={() => setScannerOpen(false)}
              />
            )}

            {isLoading && <p className="modal__hint">Suche läuft …</p>}

            {results.length > 0 && (
              <ul className="food-list">
                {results.map((food, idx) => (
                  <li key={food.id ?? idx}>
                    <button
                      className="food-list__item"
                      onClick={() => handleSelectFood(food)}
                    >
                      <span className="food-list__name">{food.name}</span>
                      <span className="food-list__kcal">
                        {food.kcal} kcal/100g
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="btn btn--ghost"
              onClick={() => setShowCustomForm((v) => !v)}
            >
              {showCustomForm ? "Abbrechen" : "+ Eigenes Lebensmittel anlegen"}
            </button>

            {showCustomForm && (
              <div className="custom-food-form">
                <input
                  className="input"
                  placeholder="Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <div className="custom-food-form__row">
                  <label>
                    kcal
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customKcal}
                      onChange={(e) => setCustomKcal(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Protein g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Kohlenhydrate g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Fett g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Ballaststoffe g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customFiber}
                      onChange={(e) => setCustomFiber(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Zucker g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customSugar}
                      onChange={(e) => setCustomSugar(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Salz g
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={customSalt}
                      onChange={(e) => setCustomSalt(Number(e.target.value))}
                    />
                  </label>
                </div>
                <button
                  className="btn btn--primary"
                  onClick={() => void handleAddCustomFood()}
                >
                  Anlegen & auswählen
                </button>
              </div>
            )}
          </>
        )}

        {step === "amount" && selectedFood && (
          <>
            <h2 className="modal__title">{selectedFood.name}</h2>
            <p className="modal__hint">
              Nährwerte pro 100 g: {selectedFood.kcal} kcal · P{" "}
              {selectedFood.protein}g · K {selectedFood.carbs}g · F{" "}
              {selectedFood.fat}g · Bst {selectedFood.fiber}g · Zck{" "}
              {selectedFood.sugar}g · Salz {selectedFood.salt}g
            </p>

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
              <button
                className="btn btn--ghost"
                onClick={() => setStep("search")}
              >
                ← Zurück
              </button>
              <button className="btn btn--primary" onClick={handleConfirm}>
                Hinzufügen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
