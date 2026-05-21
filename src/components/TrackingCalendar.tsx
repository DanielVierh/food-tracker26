import { useState } from "react";
import { useHistory, useMonthKcal } from "../hooks/useEntries";
import { useSettings } from "../hooks/useSettings";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface TrackingCalendarProps {
  onDayClick?: (date: string) => void;
}

export default function TrackingCalendar({
  onDayClick,
}: TrackingCalendarProps) {
  const trackedDates = useHistory();
  const trackedSet = new Set(trackedDates);
  const { settings } = useSettings();

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthKcal = useMonthKcal(year, month);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Mo = 0

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isoDate(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const trackedInMonth = trackedDates.filter((d) =>
    d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  ).length;

  return (
    <div className="cal">
      <div className="cal__header">
        <button className="cal__nav-btn" onClick={prevMonth}>
          &#x2039;
        </button>
        <span className="cal__title">
          {firstDay.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button className="cal__nav-btn" onClick={nextMonth}>
          &#x203a;
        </button>
      </div>

      <div className="cal__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal__grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const iso = isoDate(day);
          const tracked = trackedSet.has(iso);
          const isToday = iso === todayIso;
          const kcal = monthKcal.get(iso) ?? 0;
          const overGoal = tracked && kcal > settings.kcal;

          const classes = [
            "cal__day",
            tracked ? (overGoal ? "cal__day--over" : "cal__day--tracked") : "",
            isToday ? "cal__day--today" : "",
            onDayClick ? "cal__day--clickable" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const label = tracked
            ? `${iso}: ${Math.round(kcal)} kcal${overGoal ? " (Ziel überschritten)" : " (im Ziel)"}`
            : iso;

          return (
            <span
              key={iso}
              className={classes}
              title={label}
              onClick={() => onDayClick?.(iso)}
            >
              {day}
            </span>
          );
        })}
      </div>

      <p className="cal__stats">
        {trackedInMonth} von {daysInMonth} Tagen getrackt
      </p>
    </div>
  );
}
