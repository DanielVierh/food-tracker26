import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import DailyView from "./components/DailyView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import FoodDatabaseView from "./components/FoodDatabaseView";
import { useSettings } from "./hooks/useSettings";
import type { View } from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<View>("daily");
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const { settings } = useSettings();

  useEffect(() => {
    const theme = settings.theme ?? "forest";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("food-tracker-theme", theme);
  }, [settings.theme]);

  function handleDaySelect(date: string) {
    setSelectedDate(date);
    setActiveView("daily");
  }

  return (
    <>
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className="main">
        {activeView === "daily" && (
          <DailyView
            key={selectedDate ?? "default"}
            initialDate={selectedDate}
          />
        )}
        {activeView === "history" && (
          <HistoryView onDayClick={handleDaySelect} />
        )}
        {activeView === "foods" && <FoodDatabaseView />}
        {activeView === "settings" && <SettingsView />}
      </main>
    </>
  );
}
