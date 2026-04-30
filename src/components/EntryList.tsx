import type { EntryWithFood, MealCategory } from "../types";
import { MEAL_CATEGORIES, MEAL_CATEGORY_ORDER } from "../constants";
import EntryCard from "./EntryCard";

interface EntryListProps {
  entries: EntryWithFood[];
  onEdit: (entry: EntryWithFood) => void;
  onDelete: (id: number) => void;
}

export default function EntryList({
  entries,
  onEdit,
  onDelete,
}: EntryListProps) {
  const grouped = MEAL_CATEGORY_ORDER.reduce<
    Record<MealCategory, EntryWithFood[]>
  >(
    (acc, meal) => {
      acc[meal] = entries.filter((e) => e.meal === meal);
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] },
  );

  return (
    <div className="entry-list">
      {MEAL_CATEGORY_ORDER.map((meal) => {
        const group = grouped[meal];
        if (group.length === 0) return null;

        return (
          <section key={meal} className="entry-list__group">
            <h3 className="entry-list__meal-heading">
              {MEAL_CATEGORIES[meal]}
            </h3>
            {group.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
