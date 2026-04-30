import { useState } from "react";
import type { ReactElement } from "react";
import "./App.css";
import Header from "./components/Header";
import DailyView from "./components/DailyView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import type { View } from "./types";

const VIEW_MAP: Record<View, ReactElement> = {
  daily: <DailyView />,
  history: <HistoryView />,
  settings: <SettingsView />,
};

export default function App() {
  const [activeView, setActiveView] = useState<View>("daily");

  return (
    <>
      <Header activeView={activeView} onNavigate={setActiveView} />
      <main className="main">{VIEW_MAP[activeView]}</main>
    </>
  );
}
