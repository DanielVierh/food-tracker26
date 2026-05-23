import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { seedDB, migrateQuantityUnit } from "./db/seed";

// Select all text in any input when focused — allows direct overwriting
document.addEventListener("focusin", (e) => {
  if (e.target instanceof HTMLInputElement) {
    e.target.select();
  }
});

seedDB()
  .then(() => migrateQuantityUnit())
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
