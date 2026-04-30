import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { DEFAULT_SETTINGS } from "../constants";
import type { Settings } from "../types";

// ---------------------------------------------------------------------------
// useSettings — reads the singleton Settings row and exposes an updater.
//
// If no Settings row exists yet, DEFAULT_SETTINGS is returned and
// automatically written to IndexedDB on first update.
// ---------------------------------------------------------------------------
export function useSettings() {
  const raw = useLiveQuery<Settings>(
    () => db.settings.get(1).then((s) => s ?? DEFAULT_SETTINGS),
    [],
  );
  const settings: Settings = raw ?? DEFAULT_SETTINGS;

  async function updateSettings(partial: Partial<Omit<Settings, "id">>) {
    const current = (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
    await db.settings.put({ ...current, ...partial, id: 1 });
  }

  return { settings, updateSettings };
}
