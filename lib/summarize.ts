import {
  EnrichedWorkout,
  AcwrResult,
  PlateauResult,
  BalanceResult,
} from './hevy';
import { computeStreakStats, buildHeatmapData } from './analytics';

export function summarizeWorkouts(
  workouts: EnrichedWorkout[],
  acwr: AcwrResult[],
  plateaus: PlateauResult[],
  balance: BalanceResult
): string {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const recent = workouts.filter(
    (w) => new Date(w.start_time) >= ninetyDaysAgo
  );

  const totalVolume = recent.reduce((sum, w) => sum + w.total_volume_kg, 0);
  const avgVolume = recent.length > 0 ? totalVolume / recent.length : 0;

  const heatmap = buildHeatmapData(recent);
  const streaks = computeStreakStats(heatmap);

  // Build per-exercise frequency map from last 90 days
  const exerciseFreq: Map<
    string,
    { title: string; sessions: number; bestWeight: number; dates: string[]; volumes: number[] }
  > = new Map();

  for (const w of recent) {
    for (const ex of w.exercises) {
      const id = ex.exercise_template_id;
      if (!exerciseFreq.has(id)) {
        exerciseFreq.set(id, {
          title: ex.title,
          sessions: 0,
          bestWeight: 0,
          dates: [],
          volumes: [],
        });
      }
      const rec = exerciseFreq.get(id)!;
      rec.sessions++;
      rec.bestWeight = Math.max(rec.bestWeight, ex.top_set_weight_kg);
      rec.dates.push(w.date);
      rec.volumes.push(ex.total_volume_kg);
    }
  }

  // Top 15 exercises by frequency
  const topExercises = Array.from(exerciseFreq.entries())
    .sort(([, a], [, b]) => b.sessions - a.sessions)
    .slice(0, 15);

  const lines: string[] = [];

  lines.push(`=== TRAINING SUMMARY (last 90 days) ===`);
  lines.push(
    `Total workouts: ${recent.length} | Total volume: ${Math.round(totalVolume).toLocaleString()} kg | Avg session: ${Math.round(avgVolume).toLocaleString()} kg`
  );
  lines.push('');

  lines.push(`=== EXERCISE HISTORY (top ${topExercises.length} by frequency) ===`);
  for (const [, rec] of topExercises) {
    const recentDates = rec.dates.slice(-3).reverse();
    const trend = computeTrend(rec.volumes);
    lines.push(`${rec.title}`);
    lines.push(
      `  Sessions: ${rec.sessions} | Best weight: ${rec.bestWeight > 0 ? rec.bestWeight + 'kg' : 'bodyweight'} | Trend: ${trend}`
    );
    lines.push(`  Recent dates: ${recentDates.join(', ')}`);
  }
  lines.push('');

  lines.push(`=== ACWR STATUS ===`);
  const acwrSummary = acwr
    .filter((a) => a.status !== 'insufficient_data')
    .map((a) => `${a.muscle_group}: ${a.ratio.toFixed(2)} (${a.status.toUpperCase()})`)
    .join(', ');
  lines.push(acwrSummary || 'Insufficient data for ACWR analysis');
  lines.push('');

  lines.push(`=== PLATEAU FLAGS ===`);
  if (plateaus.length === 0) {
    lines.push('No plateaus detected');
  } else {
    for (const p of plateaus.slice(0, 5)) {
      lines.push(
        `${p.exercise_title}: ${p.stall_weeks} week stall at ${p.last_best}kg (${p.risk.toUpperCase()} risk)`
      );
    }
  }
  lines.push('');

  lines.push(`=== STRENGTH BALANCE (last 30 days) ===`);
  lines.push(
    `Push: ${Math.round(balance.push_volume)}kg | Pull: ${Math.round(balance.pull_volume)}kg | Push/Pull ratio: ${balance.push_pull_ratio.toFixed(2)}`
  );
  lines.push(
    `Quad: ${Math.round(balance.quad_volume)}kg | Hip/Posterior: ${Math.round(balance.hip_volume)}kg | Quad/Hip ratio: ${balance.quad_hip_ratio.toFixed(2)}`
  );
  if (balance.warning) lines.push(`WARNING: ${balance.warning}`);
  lines.push('');

  lines.push(`=== CONSISTENCY ===`);
  lines.push(
    `Current streak: ${streaks.current_streak} days | Longest streak: ${streaks.longest_streak} days | Avg gap between sessions: ${streaks.avg_gap_days} days`
  );

  return lines.join('\n');
}

function computeTrend(volumes: number[]): string {
  if (volumes.length < 4) return 'insufficient data';
  const recent = volumes.slice(-4);
  const older = volumes.slice(-8, -4);
  if (older.length === 0) return 'insufficient data';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const pct = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100;

  if (pct > 10) return `+${pct.toFixed(0)}% volume trend`;
  if (pct < -10) return `${pct.toFixed(0)}% volume trend (declining)`;
  return 'plateau';
}
