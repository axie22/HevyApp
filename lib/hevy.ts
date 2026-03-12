import { unstable_cache } from 'next/cache';

const BASE = 'https://api.hevyapp.com';
const PAGE_SIZE = 10;
const MAX_PAGES = 500;

// ─── Raw API Types ──────────────────────────────────────────────────────────

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'myorep';

export interface HevySet {
  index: number;
  type: SetType;       // API field is "type" not "set_type"
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  notes: string | null;
  exercise_template_id: string;
  superset_id: number | null;   // API field is "superset_id" not "supersets_id"
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  updated_at: string;
  created_at: string;
  exercises: HevyExercise[];
}

export interface HevyWorkoutsResponse {
  page: number;
  page_count: number;
  workouts: HevyWorkout[];
}

export interface HevyExerciseTemplate {
  id: string;
  title: string;
  type: string;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  is_custom: boolean;
}

export interface HevyExerciseTemplatesResponse {
  page: number;
  page_count: number;
  exercise_templates: HevyExerciseTemplate[];
}

// ─── Enriched Types ──────────────────────────────────────────────────────────

export interface EnrichedSet extends HevySet {
  volume_kg: number;
  is_working_set: boolean;
}

export interface EnrichedExercise {
  index: number;
  title: string;
  notes: string | null;
  exercise_template_id: string;
  superset_id: number | null;
  sets: EnrichedSet[];
  total_volume_kg: number;
  working_set_count: number;
  top_set_weight_kg: number;
  muscle_groups: string[];
}

export interface EnrichedWorkout {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  updated_at: string;
  created_at: string;
  exercises: EnrichedExercise[];
  total_volume_kg: number;
  duration_minutes: number;
  date: string; // YYYY-MM-DD
}

// ─── Analytics Output Types ──────────────────────────────────────────────────

export interface AcwrResult {
  muscle_group: string;
  acute_load: number;
  chronic_load: number;
  ratio: number;
  status: 'danger' | 'optimal' | 'undertrained' | 'insufficient_data';
}

export interface PlateauResult {
  exercise_title: string;
  exercise_template_id: string;
  stall_weeks: number;
  metric: 'weight' | 'volume' | 'reps';
  last_best: number;
  is_deload: boolean;
  risk: 'high' | 'medium' | 'none';
}

export interface BalanceResult {
  push_volume: number;
  pull_volume: number;
  push_pull_ratio: number;
  quad_volume: number;
  hip_volume: number;
  quad_hip_ratio: number;
  period_days: number;
  warning: string | null;
}

export interface SessionQualityResult {
  workout_id: string;
  date: string;
  score: number;
  density_score: number;
  completeness_score: number;
  timing_score: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  volume_kg: number;
  workout_count: number;
}

export interface WeeklyVolumePoint {
  week: string;          // YYYY-MM-DD, always a Monday (UTC)
  volume_kg: number;
  workout_count: number;
  is_current: boolean;   // true if this week contains today
}

export interface PersonalRecord {
  exercise_template_id: string;
  exercise_title: string;
  best_weight_kg: number;
  best_date: string;     // YYYY-MM-DD when PR was set
  is_recent: boolean;    // true if best_date is within last 30 days
}

export interface MuscleReadiness {
  muscle_group: string;
  fitness: number;       // CTL signal — cumulative adaptation
  fatigue: number;       // ATL signal — acute fatigue
  form: number;          // fitness - fatigue
  readiness: number;     // 0–100 normalized score
  status: 'fresh' | 'optimal' | 'fatigued' | 'overtrained';
}

export interface OverloadSuggestion {
  exercise_template_id: string;
  exercise_title: string;
  suggestion: 'add_weight' | 'add_rep' | 'deload' | 'maintain';
  rationale: string;
  last_weight_kg: number;
  suggested_weight_kg: number | null;
  sessions_analyzed: number;
}

export interface OneRMPoint {
  date: string;               // YYYY-MM-DD
  estimated_1rm_kg: number;
}

export interface OneRMSeries {
  exercise_template_id: string;
  exercise_title: string;
  points: OneRMPoint[];       // sorted by date ascending
}

export interface ConsistencyWeek {
  week: string;               // YYYY-MM-DD Monday
  score: number;              // 0–100
  push_hit: boolean;
  pull_hit: boolean;
  quad_hit: boolean;
  hip_hit: boolean;
  workout_count: number;
}

export interface ConsistencyResult {
  weeks: ConsistencyWeek[];
  avg_score: number;
}

// ─── Muscle Group Normalization ──────────────────────────────────────────────

const MUSCLE_ALIASES: Record<string, string> = {
  quadriceps: 'quads',
  'quads': 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  'lower back': 'lower_back',
  'lower_back': 'lower_back',
  'upper back': 'back',
  back: 'back',
  lats: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  delts: 'shoulders',
  'front delts': 'shoulders',
  'rear delts': 'rear_delts',
  triceps: 'triceps',
  biceps: 'biceps',
  abs: 'abs',
  core: 'abs',
  calves: 'calves',
  'hip flexors': 'hip_flexors',
  traps: 'traps',
  forearms: 'forearms',
  'full body': 'full_body',
  cardio: 'cardio',
};

export function normalizeMuscle(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return MUSCLE_ALIASES[lower] ?? lower;
}

// ─── Hevy API Client ──────────────────────────────────────────────────────────

async function fetchAllWorkouts(): Promise<HevyWorkout[]> {
  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey) throw new Error('HEVY_API_KEY is not set');

  const all: HevyWorkout[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const res = await fetch(
      `${BASE}/v1/workouts?page=${page}&pageSize=${PAGE_SIZE}`,
      {
        headers: { 'api-key': apiKey },
        next: { revalidate: 7200 },
      }
    );
    if (!res.ok) throw new Error(`Hevy API error: ${res.status}`);
    const data: HevyWorkoutsResponse = await res.json();
    all.push(...data.workouts);
    if (page >= data.page_count) break;
    page++;
  }

  return all;
}

async function fetchAllExerciseTemplates(): Promise<HevyExerciseTemplate[]> {
  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey) throw new Error('HEVY_API_KEY is not set');

  const all: HevyExerciseTemplate[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const res = await fetch(
      `${BASE}/v1/exercise_templates?page=${page}&pageSize=${PAGE_SIZE}`,
      {
        headers: { 'api-key': apiKey },
        next: { revalidate: 7200 },
      }
    );
    if (!res.ok) throw new Error(`Hevy API error: ${res.status}`);
    const data: HevyExerciseTemplatesResponse = await res.json();
    all.push(...data.exercise_templates);
    if (page >= data.page_count) break;
    page++;
  }

  return all;
}

export const getCachedWorkouts = unstable_cache(
  fetchAllWorkouts,
  ['hevy-workouts'],
  { revalidate: 7200, tags: ['hevy'] }
);

export const getCachedTemplates = unstable_cache(
  fetchAllExerciseTemplates,
  ['hevy-templates'],
  { revalidate: 7200, tags: ['hevy'] }
);

// ─── Template Map ────────────────────────────────────────────────────────────

export function buildTemplateMap(
  templates: HevyExerciseTemplate[]
): Map<string, HevyExerciseTemplate> {
  return new Map(templates.map((t) => [t.id, t]));
}

// ─── Enrichment ──────────────────────────────────────────────────────────────

export function enrichWorkouts(
  raw: HevyWorkout[],
  templateMap: Map<string, HevyExerciseTemplate>
): EnrichedWorkout[] {
  return raw
    .map((workout) => {
      const exercises: EnrichedExercise[] = workout.exercises.map((ex) => {
        const template = templateMap.get(ex.exercise_template_id);
        const rawMuscles: string[] = template
          ? [
              template.primary_muscle_group,
              ...template.secondary_muscle_groups,
            ]
          : [];
        const muscle_groups = [...new Set(rawMuscles.map(normalizeMuscle))];

        const sets: EnrichedSet[] = ex.sets.map((s) => {
          const is_working_set =
            s.type === 'normal' ||
            s.type === 'failure' ||
            s.type === 'dropset' ||
            s.type === 'myorep';
          const volume_kg =
            is_working_set
              ? (s.weight_kg ?? 0) * (s.reps ?? 0)
              : 0;
          return { ...s, volume_kg, is_working_set };
        });

        const working_sets = sets.filter((s) => s.is_working_set);
        const total_volume_kg = working_sets.reduce(
          (sum, s) => sum + s.volume_kg,
          0
        );
        const working_set_count = working_sets.length;
        const top_set_weight_kg = Math.max(
          0,
          ...working_sets.map((s) => s.weight_kg ?? 0)
        );

        return {
          index: ex.index,
          title: ex.title,
          notes: ex.notes,
          exercise_template_id: ex.exercise_template_id,
          superset_id: ex.superset_id,
          sets,
          total_volume_kg,
          working_set_count,
          top_set_weight_kg,
          muscle_groups,
        };
      });

      const total_volume_kg = exercises.reduce(
        (sum, e) => sum + e.total_volume_kg,
        0
      );
      const start = new Date(workout.start_time).getTime();
      const end = new Date(workout.end_time).getTime();
      const duration_minutes = Math.max(0, Math.round((end - start) / 60000));
      const date = workout.start_time.slice(0, 10);

      return {
        ...workout,
        exercises,
        total_volume_kg,
        duration_minutes,
        date,
      };
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}
