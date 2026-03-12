import fs from 'fs/promises';
import path from 'path';
import type { NutritionLog } from './nutrition';

const DATA_PATH = path.join(process.cwd(), 'data', 'nutrition.json');

export async function readNutritionLogServer(): Promise<NutritionLog> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as NutritionLog;
  } catch {
    return {};
  }
}

function numAvg(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === 'number');
  return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
}

function fmt(n: number | null, suffix = ''): string {
  return n !== null ? `${Math.round(n)}${suffix}` : '—';
}

export function summarizeNutrition(log: NutritionLog): string {
  const today = new Date().toISOString().slice(0, 10);
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const tracked = days.filter((d) => {
    const e = log[d];
    return e && (e.calories !== null || e.protein_g !== null);
  });

  if (tracked.length === 0) return 'No nutrition data logged in the last 14 days.';

  const lines: string[] = [];
  lines.push(`Tracked ${tracked.length}/14 days`);
  lines.push('Date       | Calories | Protein | Carbs  | Fat');
  lines.push('-----------|----------|---------|--------|-----');

  for (const d of tracked) {
    const e = log[d];
    if (!e) continue;
    lines.push(
      `${d} | ${fmt(e.calories, ' kcal')} | ${fmt(e.protein_g, 'g')} | ${fmt(e.carbs_g, 'g')} | ${fmt(e.fat_g, 'g')}`
    );
    if (e.notes?.trim()) lines.push(`           Notes: ${e.notes.trim()}`);
  }

  const avgCal     = numAvg(tracked.map((d) => log[d]?.calories));
  const avgProtein = numAvg(tracked.map((d) => log[d]?.protein_g));
  const avgCarbs   = numAvg(tracked.map((d) => log[d]?.carbs_g));
  const avgFat     = numAvg(tracked.map((d) => log[d]?.fat_g));

  lines.push('');
  lines.push(
    `14-day averages: ${fmt(avgCal, ' kcal')} | ${fmt(avgProtein, 'g protein')} | ${fmt(avgCarbs, 'g carbs')} | ${fmt(avgFat, 'g fat')}`
  );

  return lines.join('\n');
}
