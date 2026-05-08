import { useMemo, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useBodyMetrics } from "../hooks/useBodyMetrics";
import { calcTargetKcal } from "../utils/macros";
import BodyMetricsChart from "./BodyMetricsChart";
import type { ActivityLevel, Settings } from "../types";

type GoalKey = keyof Omit<
  Settings,
  "id" | "age" | "gender" | "height" | "targetWeight" | "activityLevel"
>;

const GOAL_FIELDS: {
  key: GoalKey;
  label: string;
  unit: string;
  minmax: string;
}[] = [
  { key: "kcal", label: "Tagesziel Kalorien", unit: "kcal", minmax: "max." },
  { key: "protein", label: "Protein", unit: "g", minmax: "min." },
  { key: "carbs", label: "Kohlenhydrate", unit: "g", minmax: "max." },
  { key: "fat", label: "Fett", unit: "g", minmax: "max." },
  { key: "fiber", label: "Ballaststoffe", unit: "g", minmax: "min." },
  { key: "sugar", label: "Zucker", unit: "g", minmax: "max." },
  { key: "salt", label: "Salz", unit: "g", minmax: "max." },
];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sitzend (kaum Bewegung)",
  light: "Leicht aktiv (1-3×/Woche Sport)",
  moderate: "Moderat aktiv (3-5×/Woche)",
  active: "Sehr aktiv (6-7×/Woche)",
};

const today = new Date().toISOString().split("T")[0];

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const { metrics, todayMetric, addOrUpdateMetric } = useBodyMetrics();

  // Draft = null means "not yet edited by user" → fall back to live DB values.
  // This avoids useEffect+setState for initializing form from async data.

  type ProfileDraft = {
    age: number;
    gender: "male" | "female";
    height: number;
    targetWeight: number;
    activityLevel: ActivityLevel;
  };
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const profile: ProfileDraft = useMemo(
    () =>
      profileDraft ?? {
        age: settings.age ?? 0,
        gender: settings.gender ?? "male",
        height: settings.height ?? 0,
        targetWeight: settings.targetWeight ?? 0,
        activityLevel: settings.activityLevel ?? "moderate",
      },
    [profileDraft, settings],
  );

  type MetricDraft = { weight: number; bodyFat: number; muscleMass: number };
  const [metricDraft, setMetricDraft] = useState<MetricDraft | null>(null);
  const [metricSaved, setMetricSaved] = useState(false);

  const metric: MetricDraft = useMemo(
    () =>
      metricDraft ?? {
        weight: todayMetric?.weight ?? 0,
        bodyFat: todayMetric?.bodyFat ?? 0,
        muscleMass: todayMetric?.muscleMass ?? 0,
      },
    [metricDraft, todayMetric],
  );

  // --- Section D: Manuelle Ziele ---
  type GoalsDraft = Omit<
    Settings,
    "id" | "age" | "gender" | "height" | "targetWeight" | "activityLevel"
  >;
  const [goalsDraft, setGoalsDraft] = useState<GoalsDraft | null>(null);
  const [goalsSaved, setGoalsSaved] = useState(false);

  const goals: GoalsDraft = useMemo(
    () =>
      goalsDraft ?? {
        kcal: settings.kcal,
        protein: settings.protein,
        carbs: settings.carbs,
        fat: settings.fat,
        fiber: settings.fiber,
        sugar: settings.sugar,
        salt: settings.salt,
      },
    [goalsDraft, settings],
  );

  // Live-Berechnung des Kcal-Ziels aus Profil + Gewicht
  const calculatedKcal = useMemo(() => {
    const { age, gender, height, targetWeight, activityLevel } = profile;
    const weight = metric.weight;
    if (!age || !height || !targetWeight || !weight) return null;
    return calcTargetKcal(
      weight,
      height,
      age,
      gender,
      activityLevel,
      targetWeight,
    );
  }, [profile, metric.weight]);

  async function handleSaveProfile() {
    await updateSettings({
      age: profile.age || undefined,
      gender: profile.gender,
      height: profile.height || undefined,
      targetWeight: profile.targetWeight || undefined,
      activityLevel: profile.activityLevel,
    });
    setProfileSaved(true);
  }

  async function handleSaveMetric() {
    if (!metric.weight) return;
    await addOrUpdateMetric(
      today,
      metric.weight,
      metric.bodyFat || undefined,
      metric.muscleMass || undefined,
    );
    // Auto-update kcal goal if calculable
    if (calculatedKcal !== null) {
      await updateSettings({ kcal: calculatedKcal });
      setGoalsDraft((prev) => ({ ...(prev ?? goals), kcal: calculatedKcal }));
    }
    setMetricSaved(true);
  }

  async function handleSaveGoals() {
    await updateSettings(goals);
    setGoalsSaved(true);
  }

  return (
    <div className="view">
      {/* ── A: Körperprofil ── */}
      <section className="settings-section">
        <h2 className="view__title">Körperprofil</h2>

        <div className="settings-grid">
          <label className="form-label">
            Alter (Jahre)
            <input
              className="input"
              type="number"
              min={10}
              max={120}
              value={profile.age || ""}
              onChange={(e) => {
                setProfileDraft((p) => ({
                  ...(p ?? profile),
                  age: Number(e.target.value),
                }));
                setProfileSaved(false);
              }}
            />
          </label>

          <label className="form-label">
            Geschlecht
            <select
              className="input"
              value={profile.gender}
              onChange={(e) => {
                setProfileDraft((p) => ({
                  ...(p ?? profile),
                  gender: e.target.value as "male" | "female",
                }));
                setProfileSaved(false);
              }}
            >
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
            </select>
          </label>

          <label className="form-label">
            Körpergröße (cm)
            <input
              className="input"
              type="number"
              min={100}
              max={250}
              value={profile.height || ""}
              onChange={(e) => {
                setProfileDraft((p) => ({
                  ...(p ?? profile),
                  height: Number(e.target.value),
                }));
                setProfileSaved(false);
              }}
            />
          </label>

          <label className="form-label">
            Zielgewicht (kg)
            <input
              className="input"
              type="number"
              min={30}
              max={300}
              value={profile.targetWeight || ""}
              onChange={(e) => {
                setProfileDraft((p) => ({
                  ...(p ?? profile),
                  targetWeight: Number(e.target.value),
                }));
                setProfileSaved(false);
              }}
            />
          </label>
        </div>

        <label className="form-label">
          Aktivitätslevel
          <select
            className="input"
            value={profile.activityLevel}
            onChange={(e) => {
              setProfileDraft((p) => ({
                ...(p ?? profile),
                activityLevel: e.target.value as ActivityLevel,
              }));
              setProfileSaved(false);
            }}
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
              <option key={level} value={level}>
                {ACTIVITY_LABELS[level]}
              </option>
            ))}
          </select>
        </label>

        <button
          className="btn btn--primary"
          onClick={() => void handleSaveProfile()}
        >
          Profil speichern
        </button>
        {profileSaved && <p className="settings__saved">Gespeichert ✓</p>}
      </section>

      {/* ── B: Heutiger Eintrag ── */}
      <section className="settings-section">
        <h2 className="view__title">Heutiger Eintrag</h2>

        <div className="settings-grid">
          <label className="form-label">
            Gewicht (kg)
            <input
              className="input"
              type="number"
              min={20}
              max={500}
              step={0.1}
              value={metric.weight || ""}
              onChange={(e) => {
                setMetricDraft((p) => ({
                  ...(p ?? metric),
                  weight: Number(e.target.value),
                }));
                setMetricSaved(false);
              }}
            />
          </label>

          <label className="form-label">
            Körperfettanteil (%)
            <input
              className="input"
              type="number"
              min={1}
              max={70}
              step={0.1}
              value={metric.bodyFat || ""}
              onChange={(e) => {
                setMetricDraft((p) => ({
                  ...(p ?? metric),
                  bodyFat: Number(e.target.value),
                }));
                setMetricSaved(false);
              }}
            />
          </label>

          <label className="form-label">
            Muskelanteil (%)
            <input
              className="input"
              type="number"
              min={1}
              max={80}
              step={0.1}
              value={metric.muscleMass || ""}
              onChange={(e) => {
                setMetricDraft((p) => ({
                  ...(p ?? metric),
                  muscleMass: Number(e.target.value),
                }));
                setMetricSaved(false);
              }}
            />
          </label>
        </div>

        {calculatedKcal !== null && (
          <p className="settings__kcal-hint">
            Berechnetes Kcal-Ziel: <strong>{calculatedKcal} kcal</strong>
          </p>
        )}

        <button
          className="btn btn--primary"
          onClick={() => void handleSaveMetric()}
          disabled={!metric.weight}
        >
          Eintrag speichern
        </button>
        {metricSaved && <p className="settings__saved">Gespeichert ✓</p>}
      </section>

      {/* ── C: Verlauf ── */}
      <section className="settings-section">
        <h2 className="view__title">Verlauf</h2>
        {metrics.length >= 2 ? (
          <BodyMetricsChart metrics={metrics} />
        ) : (
          <p className="settings__kcal-hint">
            {metrics.length === 0
              ? "Noch keine Einträge vorhanden. Trage täglich dein Gewicht ein."
              : `1 Eintrag vorhanden. Der Chart erscheint ab dem 2. Tag.`}
          </p>
        )}
      </section>

      {/* ── D: Manuelle Makroziele ── */}
      <section className="settings-section">
        <h2 className="view__title">Manuelle Ziele</h2>

        {GOAL_FIELDS.map(({ key, label, unit, minmax }) => (
          <label key={key} className="form-label">
            {minmax} {label} ({unit})
            <input
              className="input"
              type="number"
              min={0}
              value={goals[key]}
              onChange={(e) => {
                setGoalsDraft((prev) => ({
                  ...(prev ?? goals),
                  [key]: Number(e.target.value),
                }));
                setGoalsSaved(false);
              }}
            />
          </label>
        ))}

        <button
          className="btn btn--primary"
          onClick={() => void handleSaveGoals()}
        >
          Speichern
        </button>
        {goalsSaved && <p className="settings__saved">Gespeichert ✓</p>}
      </section>

      <p className="settings__version">Version {__APP_VERSION__}</p>
    </div>
  );
}
