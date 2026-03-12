import {
  EnrichedWorkout,
  AcwrResult,
  PlateauResult,
  BalanceResult,
  SessionQualityResult,
  HeatmapDay,
  WeeklyVolumePoint,
  PersonalRecord,
} from './hevy';

// ─── ACWR Calculation ─────────────────────────────────────────────────────────

const PUSH_MUSCLES = new Set(['chest', 'shoulders', 'triceps']);
const PULL_MUSCLES = new Set(['back', 'biceps', 'rear_delts']);
const QUAD_MUSCLES = new Set(['quads']);
const HIP_MUSCLES  = new Set(['hamstrings', 'glutes']);

export function calculateAcwr(
  workouts: EnrichedWorkout[],
  referenceDate: Date = new Date()
): AcwrResult[] {
  // Normalize to UTC date string — consistent with w.date (also UTC-sliced from start_time)
  const refStr = referenceDate.toISOString().slice(0, 10);

  // Returns the date string N calendar days before refStr (uses noon UTC to avoid DST edge cases)
  function daysBefore(n: number): string {
    const d = new Date(refStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // 7-day acute window: [day7Str, refStr], 28-day chronic window: [day28Str, refStr] (inclusive)
  const day7Str  = daysBefore(6);  // 7 days inclusive (today + 6 prior days)
  const day28Str = daysBefore(27); // 28 days inclusive

  // Build per-muscle-group daily volume records
  const muscleVolume: Map<string, Map<string, number>> = new Map();

  for (const w of workouts) {
    if (w.date > refStr || w.date < day28Str) continue;

    for (const ex of w.exercises) {
      for (const muscle of ex.muscle_groups) {
        if (!muscleVolume.has(muscle)) muscleVolume.set(muscle, new Map());
        const dayMap = muscleVolume.get(muscle)!;
        dayMap.set(w.date, (dayMap.get(w.date) ?? 0) + ex.total_volume_kg);
      }
    }
  }

  const results: AcwrResult[] = [];

  for (const [muscle, dayMap] of muscleVolume) {
    let acute_load = 0;
    let chronic_total = 0;
    let chronic_days_count = 0;

    for (const [dateStr, vol] of dayMap) {
      if (dateStr >= day7Str && dateStr <= refStr) {
        acute_load += vol;
      }
      if (dateStr >= day28Str && dateStr <= refStr) {
        chronic_total += vol;
        chronic_days_count++;
      }
    }

    // Require at least 2 distinct training days in 28-day window
    if (chronic_days_count < 2) {
      if (acute_load > 0) {
        results.push({
          muscle_group: muscle,
          acute_load,
          chronic_load: 0,
          ratio: 0,
          status: 'insufficient_data',
        });
      }
      continue;
    }

    // Normalize 28-day total to a 7-day equivalent
    const chronic_load = (chronic_total / 28) * 7;
    const ratio = chronic_load > 0 ? acute_load / chronic_load : 0;

    let status: AcwrResult['status'];
    if (ratio > 1.5) status = 'danger';
    else if (ratio >= 0.8) status = 'optimal';
    else status = 'undertrained';

    results.push({ muscle_group: muscle, acute_load, chronic_load, ratio, status });
  }

  return results.sort((a, b) => b.ratio - a.ratio);
}

// ─── Plateau Detection ────────────────────────────────────────────────────────

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const jan4 = new Date(thursday.getFullYear(), 0, 4);
  const week = Math.ceil(
    ((thursday.getTime() - jan4.getTime()) / 86400000 + ((jan4.getDay() + 6) % 7)) / 7
  );
  return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function detectPlateaus(workouts: EnrichedWorkout[]): PlateauResult[] {
  const now = Date.now();
  const sixWeeksAgo = now - 42 * 86400000;

  // Group exercises by template ID
  const exerciseHistory: Map<
    string,
    { title: string; sessions: { date: string; weight: number; volume: number; reps: number }[] }
  > = new Map();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!exerciseHistory.has(ex.exercise_template_id)) {
        exerciseHistory.set(ex.exercise_template_id, { title: ex.title, sessions: [] });
      }
      const workingSets = ex.sets.filter((s) => s.is_working_set);
      if (workingSets.length === 0) continue;

      const weight = Math.max(0, ...workingSets.map((s) => s.weight_kg ?? 0));
      const volume = workingSets.reduce((sum, s) => sum + s.volume_kg, 0);
      const reps = Math.max(0, ...workingSets.map((s) => s.reps ?? 0));

      exerciseHistory.get(ex.exercise_template_id)!.sessions.push({
        date: w.date,
        weight,
        volume,
        reps,
      });
    }
  }

  const results: PlateauResult[] = [];

  for (const [id, { title, sessions }] of exerciseHistory) {
    // Need at least 3 sessions in the last 6 weeks
    const recentSessions = sessions.filter(
      (s) => new Date(s.date).getTime() >= sixWeeksAgo
    );
    if (recentSessions.length < 3) continue;

    // Build weekly aggregations
    const weeklyMap: Map<
      string,
      { weight: number; volume: number; reps: number }
    > = new Map();

    for (const s of sessions) {
      const week = getISOWeek(s.date);
      const existing = weeklyMap.get(week);
      if (!existing) {
        weeklyMap.set(week, { weight: s.weight, volume: s.volume, reps: s.reps });
      } else {
        weeklyMap.set(week, {
          weight: Math.max(existing.weight, s.weight),
          volume: Math.max(existing.volume, s.volume),
          reps: Math.max(existing.reps, s.reps),
        });
      }
    }

    const weeks = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    if (weeks.length < 4) continue;

    const lastN = weeks.slice(-4);
    const baseline = weeks.slice(-8, -4);
    if (baseline.length < 1) continue;

    const baselineWeight = Math.max(...baseline.map((w) => w.weight));
    const baselineVolume = Math.max(...baseline.map((w) => w.volume));

    // Check if last 3 weeks show no progress vs the week before
    const recentWeeks = lastN.slice(1); // last 3 of the 4
    const referenceWeek = lastN[0];

    const noWeightGain = recentWeeks.every(
      (w) => w.weight <= referenceWeek.weight * 1.02
    );
    const noVolumeGain = recentWeeks.every(
      (w) => w.volume <= referenceWeek.volume * 1.05
    );
    const noRepsGain = recentWeeks.every((w) => w.reps <= referenceWeek.reps);

    if (!noWeightGain || !noVolumeGain || !noRepsGain) continue;

    // Check for deload (volume AND weight lower than baseline by >15%)
    const latestWeight = lastN[lastN.length - 1].weight;
    const latestVolume = lastN[lastN.length - 1].volume;
    const is_deload =
      latestWeight < baselineWeight * 0.85 &&
      latestVolume < baselineVolume * 0.85;

    if (is_deload) continue;

    // Count stall weeks
    let stall_weeks = 0;
    for (let i = weeks.length - 1; i > 0; i--) {
      const cur = weeks[i];
      const prev = weeks[i - 1];
      if (
        cur.weight <= prev.weight * 1.02 &&
        cur.volume <= prev.volume * 1.05 &&
        cur.reps <= prev.reps
      ) {
        stall_weeks++;
      } else {
        break;
      }
    }

    if (stall_weeks < 2) continue;

    const risk: PlateauResult['risk'] = stall_weeks >= 4 ? 'high' : 'medium';
    const lastBestWeight = Math.max(...weeks.map((w) => w.weight));

    results.push({
      exercise_title: title,
      exercise_template_id: id,
      stall_weeks,
      metric: 'weight',
      last_best: lastBestWeight,
      is_deload,
      risk,
    });
  }

  return results.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, none: 2 };
    return riskOrder[a.risk] - riskOrder[b.risk] || b.stall_weeks - a.stall_weeks;
  });
}

// ─── Strength Balance ─────────────────────────────────────────────────────────

export function analyzeBalance(
  workouts: EnrichedWorkout[],
  periodDays = 30
): BalanceResult {
  const cutoff = Date.now() - periodDays * 86400000;
  const recent = workouts.filter(
    (w) => new Date(w.start_time).getTime() >= cutoff
  );

  let push = 0, pull = 0, quad = 0, hip = 0;

  for (const w of recent) {
    for (const ex of w.exercises) {
      const primary = ex.muscle_groups[0];
      if (!primary) continue;
      const vol = ex.total_volume_kg;
      if (PUSH_MUSCLES.has(primary)) push += vol;
      else if (PULL_MUSCLES.has(primary)) pull += vol;
      else if (QUAD_MUSCLES.has(primary)) quad += vol;
      else if (HIP_MUSCLES.has(primary)) hip += vol;
    }
  }

  const push_pull_ratio = pull > 0 ? push / pull : push > 0 ? 99 : 1;
  const quad_hip_ratio  = hip  > 0 ? quad / hip  : quad > 0 ? 99 : 1;

  let warning: string | null = null;
  if (push_pull_ratio > 2.0) {
    warning = `You're doing ${push_pull_ratio.toFixed(1)}× more pushing than pulling this period`;
  } else if (push_pull_ratio < 0.5 && pull > 0) {
    warning = `Pull-dominant imbalance detected (${push_pull_ratio.toFixed(1)}× push/pull)`;
  } else if (quad_hip_ratio > 2.5) {
    warning = `Quad-dominant pattern detected — consider more posterior chain work`;
  }

  return {
    push_volume: push,
    pull_volume: pull,
    push_pull_ratio,
    quad_volume: quad,
    hip_volume: hip,
    quad_hip_ratio,
    period_days: periodDays,
    warning,
  };
}

// ─── Session Quality Score ────────────────────────────────────────────────────

export function scoreSession(
  workout: EnrichedWorkout,
  allWorkouts: EnrichedWorkout[]
): SessionQualityResult {
  // Density score
  let density_score = 5; // default mid if no duration
  if (workout.duration_minutes > 0) {
    const density = workout.total_volume_kg / workout.duration_minutes;
    const densities = allWorkouts
      .filter((w) => w.duration_minutes > 0)
      .map((w) => w.total_volume_kg / w.duration_minutes)
      .sort((a, b) => a - b);
    const p90idx = Math.floor(densities.length * 0.9);
    const p90 = densities[p90idx] ?? densities[densities.length - 1] ?? 1;
    density_score = Math.min(10, (density / p90) * 10);
  }

  // Completeness score
  const completenessScores: number[] = [];
  for (const ex of workout.exercises) {
    const pastInstances = allWorkouts
      .filter((w) => w.id !== workout.id)
      .flatMap((w) => w.exercises)
      .filter((e) => e.exercise_template_id === ex.exercise_template_id)
      .slice(-8);
    if (pastInstances.length === 0) continue;
    const avgSets =
      pastInstances.reduce((sum, e) => sum + e.working_set_count, 0) /
      pastInstances.length;
    if (avgSets === 0) continue;
    completenessScores.push(Math.min(1, ex.working_set_count / avgSets));
  }
  const completeness_score =
    completenessScores.length > 0
      ? (completenessScores.reduce((a, b) => a + b, 0) /
          completenessScores.length) *
        10
      : 7; // default if no history

  // Timing score
  const workoutMuscles = new Set(
    workout.exercises.flatMap((e) => e.muscle_groups)
  );
  const workoutStart = new Date(workout.start_time).getTime();

  let timingGapHours = 72; // default to well-rested
  for (let i = allWorkouts.length - 1; i >= 0; i--) {
    const other = allWorkouts[i];
    if (other.id === workout.id) continue;
    const otherEnd = new Date(other.end_time).getTime();
    if (otherEnd >= workoutStart) continue;

    const overlaps = other.exercises.some((e) =>
      e.muscle_groups.some((m) => workoutMuscles.has(m))
    );
    if (overlaps) {
      timingGapHours = (workoutStart - otherEnd) / 3600000;
      break;
    }
  }

  let timing_score: number;
  if (timingGapHours >= 48) {
    timing_score = 10;
  } else if (timingGapHours >= 24) {
    timing_score = 5 + ((timingGapHours - 24) / 24) * 5;
  } else {
    timing_score = (timingGapHours / 24) * 5;
  }

  const score = Math.round(
    ((density_score + completeness_score + timing_score) / 3) * 10
  ) / 10;

  return {
    workout_id: workout.id,
    date: workout.date,
    score,
    density_score: Math.round(density_score * 10) / 10,
    completeness_score: Math.round(completeness_score * 10) / 10,
    timing_score: Math.round(timing_score * 10) / 10,
  };
}

export function scoreAllSessions(
  workouts: EnrichedWorkout[]
): SessionQualityResult[] {
  return workouts.map((w) => scoreSession(w, workouts));
}

// ─── Consistency Heatmap ──────────────────────────────────────────────────────

export function buildHeatmapData(workouts: EnrichedWorkout[]): HeatmapDay[] {
  const dayMap = new Map<string, HeatmapDay>();

  for (const w of workouts) {
    const existing = dayMap.get(w.date);
    if (existing) {
      existing.volume_kg += w.total_volume_kg;
      existing.workout_count++;
    } else {
      dayMap.set(w.date, {
        date: w.date,
        volume_kg: w.total_volume_kg,
        workout_count: 1,
      });
    }
  }

  return Array.from(dayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function computeStreakStats(heatmap: HeatmapDay[]): {
  current_streak: number;
  longest_streak: number;
  avg_gap_days: number;
} {
  if (heatmap.length === 0)
    return { current_streak: 0, longest_streak: 0, avg_gap_days: 0 };

  const dates = heatmap.map((d) => d.date).sort();
  const today = new Date().toISOString().slice(0, 10);

  // Current streak (consecutive days ending at today or yesterday)
  let current_streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Walk backward from today
  for (let i = dates.length - 1; i >= 0; i--) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (dates[i] === expected) {
      current_streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dates[i] < expected) {
      // Gap — streak ends (but allow yesterday as start)
      if (current_streak === 0 && dates[i] === yesterday()) {
        current_streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longest_streak = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      cur++;
      longest_streak = Math.max(longest_streak, cur);
    } else {
      cur = 1;
    }
  }

  // Average gap between sessions
  let totalGap = 0;
  let gapCount = 0;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    totalGap += (curr.getTime() - prev.getTime()) / 86400000;
    gapCount++;
  }
  const avg_gap_days = gapCount > 0 ? Math.round((totalGap / gapCount) * 10) / 10 : 0;

  return { current_streak, longest_streak, avg_gap_days };
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ─── Weekly Volume ─────────────────────────────────────────────────────────────

export function computeWeeklyVolume(
  workouts: EnrichedWorkout[],
  weeks = 16
): WeeklyVolumePoint[] {
  // Returns the UTC Monday date string for any given YYYY-MM-DD date string
  function getMondayStr(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    const dow = d.getUTCDay(); // 0=Sun
    const offset = dow === 0 ? -6 : 1 - dow;
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentWeekMonday = getMondayStr(todayStr);

  // Start of the window: N-1 weeks before current Monday
  const cutoff = new Date(currentWeekMonday + 'T12:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate() - (weeks - 1) * 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Aggregate workouts into their week buckets
  const weekMap = new Map<string, { volume_kg: number; workout_count: number }>();
  for (const w of workouts) {
    if (w.date < cutoffStr) continue;
    const monday = getMondayStr(w.date);
    const existing = weekMap.get(monday);
    if (existing) {
      existing.volume_kg += w.total_volume_kg;
      existing.workout_count++;
    } else {
      weekMap.set(monday, { volume_kg: w.total_volume_kg, workout_count: 1 });
    }
  }

  // Build result including zero-volume weeks
  const result: WeeklyVolumePoint[] = [];
  const cursor = new Date(cutoffStr + 'T12:00:00Z');
  for (let i = 0; i < weeks; i++) {
    const weekStr = cursor.toISOString().slice(0, 10);
    const data = weekMap.get(weekStr);
    result.push({
      week: weekStr,
      volume_kg: data?.volume_kg ?? 0,
      workout_count: data?.workout_count ?? 0,
      is_current: weekStr === currentWeekMonday,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return result;
}

// ─── Personal Records ──────────────────────────────────────────────────────────

export function findPersonalRecords(
  workouts: EnrichedWorkout[]
): PersonalRecord[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(todayStr + 'T12:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const recentCutoff = cutoff.toISOString().slice(0, 10);

  // Track best weight per exercise (workouts are sorted chronologically, so later ones naturally win ties)
  const prMap = new Map<string, { title: string; best_weight_kg: number; best_date: string }>();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.top_set_weight_kg <= 0) continue;
      const existing = prMap.get(ex.exercise_template_id);
      if (!existing || ex.top_set_weight_kg > existing.best_weight_kg) {
        prMap.set(ex.exercise_template_id, {
          title: ex.title,
          best_weight_kg: ex.top_set_weight_kg,
          best_date: w.date,
        });
      }
    }
  }

  return Array.from(prMap.entries())
    .map(([id, rec]) => ({
      exercise_template_id: id,
      exercise_title: rec.title,
      best_weight_kg: rec.best_weight_kg,
      best_date: rec.best_date,
      is_recent: rec.best_date >= recentCutoff,
    }))
    .sort((a, b) => b.best_weight_kg - a.best_weight_kg)
    .slice(0, 20);
}
