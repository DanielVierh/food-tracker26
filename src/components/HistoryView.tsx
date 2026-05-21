import { useState } from "react";
import { useHistory, useEntries, useHistoryData } from "../hooks/useEntries";
import { useSettings } from "../hooks/useSettings";
import MacroHistoryChart from "./MacroHistoryChart";
import { sumMacros } from "../utils/macros";
import MacroSummary from "./MacroSummary";
import TrackingCalendar from "./TrackingCalendar";
import type { EntryWithFood } from "../types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface DaySummaryProps {
  date: string;
}

function DaySummary({ date }: DaySummaryProps) {
  const { entries } = useEntries(date);
  const { settings } = useSettings();
  const totals = sumMacros(entries.map((e: EntryWithFood) => e.computed));
  const burnedKcal = Number(localStorage.getItem(`burned-kcal-${date}`) ?? 0);
  const effective_kcal = Math.round(totals.kcal - burnedKcal);
  const steps = Number(localStorage.getItem(`steps-${date}`) ?? "0");

  return (
    <details className="history-day">
      <summary className="history-day__summary">
        <span className="history-day__date">{formatDate(date)}</span>
        <span className="history-day__kcal">{effective_kcal} kcal</span>
        <span className="history-day__macros">
          FT {totals.fat}g | P {totals.protein}g | KH {totals.carbs}g | ZKR{" "}
          {totals.sugar}g | BAL {totals.fiber}g | SZ {totals.salt}g
        </span>
      </summary>
      <div className="history-day__body">
        <MacroSummary
          totals={totals}
          goals={settings}
          burnedKcal={burnedKcal}
          steps={steps}
        />
      </div>
    </details>
  );
}

export default function HistoryView({
  onDayClick,
}: { onDayClick?: (date: string) => void } = {}) {
  const dates = useHistory();
  const historyData = useHistoryData(60);
  const { settings } = useSettings();
  const [limit, setLimit] = useState(7);

  if (dates.length === 0) {
    return (
      <div className="view">
        <p className="empty-state">Noch keine Einträge vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="view">
      <h2 className="view__title">Verlauf</h2>
      <TrackingCalendar onDayClick={onDayClick} />
      <MacroHistoryChart
        data={historyData}
        kcalGoal={settings.kcal}
        macroGoals={settings}
      />
      {(dates as string[]).slice(0, limit).map((date: string) => (
        <DaySummary key={date} date={date} />
      ))}
      {limit < dates.length && (
        <button
          className="btn btn--ghost"
          onClick={() => setLimit((l) => l + 7)}
        >
          Mehr anzeigen
        </button>
      )}
    </div>
  );
}
