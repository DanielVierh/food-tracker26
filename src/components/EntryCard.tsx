import type { EntryWithFood } from "../types";

interface EntryCardProps {
  entry: EntryWithFood;
  onDelete: (id: number) => void;
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const { food, computed, amountG, id } = entry;

  function handleDelete() {
    if (id !== undefined) onDelete(id);
  }

  return (
    <div className="entry-card">
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
      <button
        className="entry-card__delete"
        onClick={handleDelete}
        aria-label={`${food.name} löschen`}
      >
        ✕
      </button>
    </div>
  );
}
