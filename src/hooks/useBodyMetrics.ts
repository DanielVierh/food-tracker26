import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { BodyMetric } from "../types";

export function useBodyMetrics() {
  const rawMetrics = useLiveQuery<BodyMetric[]>(
    () => db.bodyMetrics.orderBy("date").toArray(),
    [],
  );
  const metrics: BodyMetric[] = rawMetrics ?? [];

  const today = new Date().toISOString().split("T")[0];
  const todayMetric = metrics.find((m) => m.date === today);
  // Letzter bekannter Eintrag als Fallback, wenn für heute noch keiner existiert
  const latestMetric =
    metrics.length > 0 ? metrics[metrics.length - 1] : undefined;

  async function addOrUpdateMetric(
    date: string,
    weight: number,
    bodyFat?: number,
    muscleMass?: number,
  ) {
    const existing = await db.bodyMetrics.where("date").equals(date).first();
    const data = { date, weight, bodyFat, muscleMass };
    if (existing?.id !== undefined) {
      await db.bodyMetrics.update(existing.id, data);
    } else {
      await db.bodyMetrics.add(data);
    }
  }

  return { metrics, todayMetric, latestMetric, addOrUpdateMetric };
}
