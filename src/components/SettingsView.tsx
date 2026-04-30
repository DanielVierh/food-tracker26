import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import type { Settings } from "../types";

type GoalKey = keyof Omit<Settings, "id">;

const GOAL_FIELDS: { key: GoalKey; label: string; unit: string }[] = [
  { key: "kcal", label: "Tagesziel Kalorien", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Kohlenhydrate", unit: "g" },
  { key: "fat", label: "Fett", unit: "g" },
  { key: "fiber", label: "Ballaststoffe", unit: "g" },
  { key: "sugar", label: "Zucker", unit: "g" },
  { key: "salt", label: "Salz", unit: "g" },
];

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Omit<Settings, "id">>({
    kcal: settings.kcal,
    protein: settings.protein,
    carbs: settings.carbs,
    fat: settings.fat,
    fiber: settings.fiber,
    sugar: settings.sugar,
    salt: settings.salt,
  });

  function handleChange(key: GoalKey, value: number) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    await updateSettings(draft);
    setSaved(true);
  }

  return (
    <div className="view">
      <h2 className="view__title">Tagesziele</h2>

      {GOAL_FIELDS.map(({ key, label, unit }) => (
        <label key={key} className="form-label">
          {label} ({unit})
          <input
            className="input"
            type="number"
            min={0}
            value={draft[key]}
            onChange={(e) => handleChange(key, Number(e.target.value))}
          />
        </label>
      ))}

      <button className="btn btn--primary" onClick={() => void handleSave()}>
        Speichern
      </button>

      {saved && <p className="settings__saved">Gespeichert ✓</p>}
    </div>
  );
}
