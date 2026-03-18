export const dynamic = 'force-dynamic';

import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import {
  buildHeatmapData,
  computeStreakStats,
  computeConsistencyScore,
  detectPlateaus,
} from '@/lib/analytics';
import { readNutritionLogServer } from '@/lib/nutrition-server';
import { getCachedWhoopRecovery, getCachedWhoopWorkouts, deduplicateAndEnrich } from '@/lib/whoop-server';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { VolumeStatCard } from '@/components/VolumeStatCard';
import { RecoverySignalCard } from '@/components/RecoverySignalCard';
import { NutritionStrip } from '@/components/NutritionStrip';
import Link from 'next/link';

export default async function DashboardPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);

  const heatmap     = buildHeatmapData(workouts);
  const streaks     = computeStreakStats(heatmap);
  const consistency = computeConsistencyScore(workouts);
  const plateaus    = detectPlateaus(workouts);

  const [whoopRecovery, whoopWorkoutsData] = await Promise.all([
    getCachedWhoopRecovery(),
    getCachedWhoopWorkouts(),
    readNutritionLogServer(), // fetched for cache warmup; NutritionStrip fetches client-side
  ]);

  const whoopEnrichedWorkouts = whoopWorkoutsData
    ? deduplicateAndEnrich(workouts, whoopWorkoutsData.workouts)
    : workouts;

  // Stats bar computation — UTC date strings
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const dow = todayDate.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekMondayDate = new Date(todayDate);
  weekMondayDate.setUTCDate(todayDate.getUTCDate() + mondayOffset);
  const weekMondayStr = weekMondayDate.toISOString().slice(0, 10);
  const monthStartStr = todayStr.slice(0, 7) + '-01';
  const thisWeekSessions  = workouts.filter((w) => w.date >= weekMondayStr).length;
  const thisMonthVolumeKg = workouts
    .filter((w) => w.date >= monthStartStr)
    .reduce((s, w) => s + w.total_volume_kg, 0);

  const activePlateaus = plateaus.filter((p) => p.risk !== 'none');
  const topPlateau = activePlateaus.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, none: 3 };
    return order[a.risk] - order[b.risk];
  })[0];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 48 }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── PAGE HEADER ── */}
        <div
          className="flex items-baseline justify-between py-8"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
            >
              Gauge
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              {workouts.length.toLocaleString()} workouts analyzed
              {workouts.length > 0 && ` · last session ${workouts[workouts.length - 1]?.date}`}
            </p>
          </div>
          <span
            className="hidden sm:block tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em' }}
          >
            {new Date().toLocaleDateString('default', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            }).toUpperCase()}
          </span>
        </div>

        {workouts.length === 0 ? (
          <div
            className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl mt-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--text-3)' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No workouts found</div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Make sure your HEVY_API_KEY is set in .env</p>
          </div>
        ) : (
          <>
            {/* ── HERO STATS ── */}
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">Sessions</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {thisWeekSessions}
                  </div>
                  <div className="mono-label mt-2">this week</div>
                </div>

                <VolumeStatCard volumeKg={thisMonthVolumeKg} />

                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">Streak</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}
                  >
                    {streaks.current_streak}
                  </div>
                  <div className="mono-label mt-2">{streaks.current_streak === 1 ? 'day' : 'days'} active</div>
                </div>

                <div className="px-6 py-7" style={{ borderRight: '1px solid var(--border)' }}>
                  <div className="mono-label mb-3">All-time</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {workouts.length.toLocaleString()}
                  </div>
                  <div className="mono-label mt-2">workouts</div>
                </div>

                <div className="px-6 py-7">
                  <div className="mono-label mb-3">Balance</div>
                  <div
                    className="tabular-nums leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
                  >
                    {consistency.avg_score}
                    <span style={{ fontSize: 24, color: 'var(--text-3)' }}>%</span>
                  </div>
                  <div className="mono-label mt-2">12-wk coverage</div>
                </div>
              </div>
            </div>

            {/* ── 2-COLUMN COMMAND CENTER ── */}
            <div className="py-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Left column: signal cards */}
              <div className="lg:col-span-1 flex flex-col gap-4">

                {/* Recovery signal */}
                <RecoverySignalCard data={whoopRecovery} />

                {/* Plateau signal */}
                <Link
                  href="/training"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          letterSpacing: '0.14em',
                          color: 'var(--text-3)',
                          fontWeight: 600,
                        }}
                      >
                        PLATEAUS
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          color: 'var(--accent)',
                        }}
                      >
                        VIEW →
                      </span>
                    </div>
                    {activePlateaus.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No active plateau alerts</p>
                    ) : (
                      <div>
                        <div
                          className="tabular-nums"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.02em' }}
                        >
                          {activePlateaus.length}
                          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>
                            {activePlateaus.length === 1 ? 'alert' : 'alerts'}
                          </span>
                        </div>
                        {topPlateau && (
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em', marginTop: 4 }}>
                            {topPlateau.exercise_title} · {topPlateau.stall_weeks}wk stall
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Nutrition strip */}
                <NutritionStrip />

              </div>

              {/* Right column: consistency heatmap */}
              <div className="lg:col-span-2">
                <ConsistencyHeatmap
                  days={heatmap}
                  workouts={whoopEnrichedWorkouts}
                  currentStreak={streaks.current_streak}
                  longestStreak={streaks.longest_streak}
                  avgGapDays={streaks.avg_gap_days}
                />
              </div>

            </div>
          </>
        )}
      </div>
    </main>
  );
}
