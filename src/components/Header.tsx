import type { View } from "../types";

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "daily", label: "Heute" },
  { view: "history", label: "Verlauf" },
  { view: "settings", label: "Ziele" },
];

export default function Header({ activeView, onNavigate }: HeaderProps) {
  return (
    <header className="header">
      <span className="header__logo">🥗 Food Tracker</span>
      <nav className="header__nav">
        {NAV_ITEMS.map(({ view, label }) => (
          <button
            key={view}
            className={`header__nav-btn${activeView === view ? " header__nav-btn--active" : ""}`}
            onClick={() => onNavigate(view)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
