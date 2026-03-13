import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';
import {
  calculateAcwr,
  detectPlateaus,
  analyzeBalance,
  scoreAllSessions,
  buildHeatmapData,
  computeStreakStats,
  computeWeeklyVolume,
  findPersonalRecords,
  computeMuscleReadiness,
  computeOverloadSuggestions,
  computeOneRMSeries,
  computeConsistencyScore,
} from '@/lib/analytics';
import { summarizeWorkouts } from '@/lib/summarize';
import { readNutritionLogServer, summarizeNutrition } from '@/lib/nutrition-server';
import { readProfileServer, summarizeProfile } from '@/lib/profile-server';
import { ConsistencyHeatmap } from '@/components/ConsistencyHeatmap';
import { MuscleReadinessChart } from '@/components/MuscleReadinessChart';
import { PlateauCards } from '@/components/PlateauCards';
import { BalanceAnalyzer } from '@/components/BalanceAnalyzer';
import { SessionQuality } from '@/components/SessionQuality';
import { WeeklyVolume } from '@/components/WeeklyVolume';
import { PersonalRecords } from '@/components/PersonalRecords';
import { OneRMChart } from '@/components/OneRMChart';
import { OverloadSuggestions } from '@/components/OverloadSuggestions';
import { NutritionDashboardWidget } from '@/components/NutritionDashboardWidget';
import { VolumeStatCard } from '@/components/VolumeStatCard';
import { ChatPanel } from '@/components/ChatPanel';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 shrink-0">{children}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

export default async function DashboardPage() {
  const [rawWorkouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);

  const templateMap = buildTemplateMap(templates);
  const workouts = enrichWorkouts(rawWorkouts, templateMap);

  const acwr        = calculateAcwr(workouts, new Date());
  const readiness   = computeMuscleReadiness(workouts);
  const plateaus    = detectPlateaus(workouts);
  const balance     = analyzeBalance(workouts, 30);
  const qualities   = scoreAllSessions(workouts);
  const heatmap     = buildHeatmapData(workouts);
  const streaks     = computeStreakStats(heatmap);
  const weeklyVolume      = computeWeeklyVolume(workouts);
  const personalRecords   = findPersonalRecords(workouts);
  const overload          = computeOverloadSuggestions(workouts);
  const oneRMSeries       = computeOneRMSeries(workouts);
  const consistency       = computeConsistencyScore(workouts);
  const [nutritionLog, profile] = await Promise.all([
    readNutritionLogServer(),
    readProfileServer(),
  ]);
  const nutritionSummary  = summarizeNutrition(nutritionLog);
  const profileSummary    = summarizeProfile(profile);
  const summary     = summarizeWorkouts(workouts, acwr, plateaus, balance, nutritionSummary, profileSummary, readiness);

  // Stats bar computation — UTC date strings
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const dow = todayDate.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekMondayDate = new Date(todayDate);
  weekMondayDate.setUTCDate(todayDate.getUTCDate() + mondayOffset);
  const weekMondayStr  = weekMondayDate.toISOString().slice(0, 10);
  const monthStartStr  = todayStr.slice(0, 7) + '-01';
  const thisWeekSessions  = workouts.filter((w) => w.date >= weekMondayStr).length;
  const thisMonthVolumeKg = workouts
    .filter((w) => w.date >= monthStartStr)
    .reduce((s, w) => s + w.total_volume_kg, 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-3xl font-bold text-zinc-100">Training Intelligence</h1>
            <span className="text-sm text-zinc-500 tabular-nums hidden sm:block">
              {new Date().toLocaleDateString('default', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-1 text-zinc-400 text-sm">
            {workouts.length.toLocaleString()} workouts analyzed
            {workouts.length > 0 && (
              <> · Last session {workouts[workouts.length - 1]?.date}</>
            )}
          </p>
        </div>

        {workouts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
            <div className="text-4xl">🏋️</div>
            <div className="text-lg font-medium text-zinc-400">No workouts found</div>
            <p className="text-sm">Make sure your HEVY_API_KEY is set correctly in .env</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats bar — unified panel */}
            <div className="rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-zinc-800">
                <div className="bg-zinc-900 px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">This week</div>
                  <div className="mt-2.5 text-3xl font-bold tabular-nums text-zinc-100 leading-none tracking-tight">{thisWeekSessions}</div>
                  <div className="text-xs text-zinc-500 mt-1.5">{thisWeekSessions === 1 ? 'session' : 'sessions'}</div>
                </div>
                <VolumeStatCard volumeKg={thisMonthVolumeKg} />
                <div className="bg-zinc-900 px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Streak</div>
                  <div className="mt-2.5 text-3xl font-bold tabular-nums text-zinc-100 leading-none tracking-tight">{streaks.current_streak}</div>
                  <div className="text-xs text-zinc-500 mt-1.5">{streaks.current_streak === 1 ? 'day' : 'days'}</div>
                </div>
                <div className="bg-zinc-900 px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">All-time</div>
                  <div className="mt-2.5 text-3xl font-bold tabular-nums text-zinc-100 leading-none tracking-tight">{workouts.length.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1.5">workouts</div>
                </div>
                <div className="bg-zinc-900 px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">12-wk balance</div>
                  <div className="mt-2.5 text-3xl font-bold tabular-nums text-zinc-100 leading-none tracking-tight">{consistency.avg_score}%</div>
                  <div className="text-xs text-zinc-500 mt-1.5">muscle coverage</div>
                </div>
              </div>
            </div>

            {/* Consistency */}
            <SectionLabel>Consistency</SectionLabel>
            <ConsistencyHeatmap
              days={heatmap}
              workouts={workouts}
              currentStreak={streaks.current_streak}
              longestStreak={streaks.longest_streak}
              avgGapDays={streaks.avg_gap_days}
            />

            {/* Recovery & Readiness */}
            <SectionLabel>Recovery &amp; Readiness</SectionLabel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MuscleReadinessChart results={readiness} />
              </div>
              <div className="lg:col-span-1">
                <BalanceAnalyzer workouts={workouts} initialBalance={balance} />
              </div>
            </div>

            {/* Volume & Strength */}
            <SectionLabel>Volume &amp; Strength</SectionLabel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <WeeklyVolume data={weeklyVolume} />
              </div>
              <div className="lg:col-span-1">
                <PersonalRecords records={personalRecords} />
              </div>
            </div>

            {/* Progression */}
            <SectionLabel>Progression</SectionLabel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <OneRMChart series={oneRMSeries} />
              </div>
              <div className="lg:col-span-1">
                <OverloadSuggestions suggestions={overload} />
              </div>
            </div>

            {/* Analysis */}
            <SectionLabel>Analysis</SectionLabel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <PlateauCards plateaus={plateaus} />
              </div>
              <div className="lg:col-span-2">
                <SessionQuality qualities={qualities} />
              </div>
            </div>

            {/* Nutrition */}
            <SectionLabel>Nutrition</SectionLabel>
            <NutritionDashboardWidget />
          </div>
        )}
      </div>

      <ChatPanel
        summary={summary}
        readiness={readiness}
        plateaus={plateaus}
        balance={balance}
        nutritionSummary={nutritionSummary}
        profileSummary={profileSummary}
      />
    </main>
  );
}
