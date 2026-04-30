import { useState } from "react";
import type { EntryWithFood } from "../types";

interface EntryCardProps {
  entry: EntryWithFood;
  onEdit: (entry: EntryWithFood) => void;
  onDelete: (id: number) => void;
}

export default function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const { food, computed, amountG, id } = entry;
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(true);
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    if (id !== undefined) onDelete(id);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(false);
  }

  return (
    <div
      className="entry-card"
      role="button"
      tabIndex={0}
      onClick={() => !confirming && onEdit(entry)}
      onKeyDown={(e) => e.key === "Enter" && !confirming && onEdit(entry)}
    >
      <div className="entry-card__info">
        <span className="entry-card__name">{food.name}</span>
        <span className="entry-card__amount">{amountG} g</span>
      </div>
      <div className="entry-card__macros">
        <span>{computed.kcal} kcal</span>
        <span>P {computed.protein}g</span>
        <span>K {computed.carbs}g</span>
        <span>F {computed.fat}g</span>
      </div>
      {confirming ? (
        <div
          className="entry-card__confirm"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="entry-card__confirm-text">Löschen?</span>
          <button
            className="btn btn--ghost entry-card__confirm-btn"
            onClick={handleCancel}
          >
            ✕
          </button>
          <button
            className="btn btn--danger entry-card__confirm-btn"
            onClick={handleConfirm}
          >
            ✓
          </button>
        </div>
      ) : (
        <button
          className="entry-card__delete"
          onClick={handleDeleteClick}
          aria-label={`${food.name} löschen`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
