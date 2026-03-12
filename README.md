# Hevy Training Intelligence Dashboard

A workout analytics dashboard that surfaces deeper training patterns from your [Hevy](https://hevy.com) data. Goes far beyond Hevy's built-in stats to show fatigue trends, plateau detection, strength balance, personal records, weekly volume progression, nutrition tracking, and an AI coach you can actually have a conversation with about your training.

---

## Walkthrough Video

<video src="assets/walkthrough.mp4" controls width="100%"></video>

A full UI walkthrough covering every feature: stats overview, consistency heatmap, fatigue and recovery, weekly volume, session quality, nutrition, and the AI coach.

---

## Features

### At-a-Glance Stats Bar

Four KPI cards at the top of the dashboard give you an instant read on where you stand: sessions this week, total volume this month (in kg), current training streak, and all-time workout count. These update live with your Hevy data and are the first thing you see when the page loads. It is a small thing but it makes the dashboard feel alive.

### Consistency Heatmap

A GitHub-style 52-week calendar that shows every training day and colors each cell by volume intensity. The left side shows day labels (Mon, Wed, Fri) so you can spot weekly patterns at a glance. Below the grid you get current streak, longest streak, total sessions, and average days between workouts.

### Fatigue and Recovery (ACWR)

Per-muscle Acute:Chronic Workload Ratio computed from your full 28-day history. Each muscle group gets a ratio bar, a status chip (Optimal, Danger, or Undertrained), and the raw acute and chronic load numbers. When all ratios are very high it means you are new to tracking, and the card tells you that directly instead of showing misleading numbers.

### Plateau Detector

Identifies exercises where you have not made meaningful progress in multiple consecutive weeks despite consistent training. Risk is classified as High (4+ weeks stalled) or Medium (2-3 weeks). The algorithm accounts for deload weeks and uses percentage tolerances on weight and volume to avoid flagging rounding noise.

### Strength Balance

Push/pull and quad/hip volume ratios across 30, 90, or 365-day windows. Imbalances above or below the warning thresholds are flagged so you can course-correct before they become a problem. Useful for identifying whether your programming has quietly drifted out of proportion.

### Weekly Volume Chart

A 16-week bar chart showing total training volume per week. The current week is highlighted in indigo so you can see where you stand relative to your recent trend. A dashed average reference line (excluding the current partial week) makes it easy to see whether volume is building, holding, or declining. This is probably the most useful chart for spotting programming trends.

### Session Quality Score

Each session is scored 1-10 based on three equally weighted components: training density (volume per minute), completeness (how many sets you hit relative to your average for each exercise), and recovery timing (gap since the last session that worked the same muscle groups). The chart shows a 7-session rolling average line so short-term noise does not obscure the trend.

### Personal Records

A full list of your best-ever top-set weight for every exercise, sorted by weight or recency. Records set in the last 30 days are badged as recent PRs. The list is paginated at 5 per page so it does not overwhelm the dashboard on accounts with a large exercise library. Weights are shown to one decimal place.

### Nutrition Log

A dedicated page at `/nutrition` for tracking daily calories, protein, carbohydrates, fat, fiber, water, and notes. A month-view calendar lets you pick any day. A stacked macro bar updates live as you type so you can see your protein/carb/fat split before you save. All data is written to a local JSON file on the server so it persists across sessions without requiring a database.

The nutrition widget on the main dashboard shows the last 7 days as day chips with calorie and protein counts, plus four average cards and recovery insight notes based on your weekly average protein and caloric intake.

### AI Coach Chat

A chat panel (bottom-right of the dashboard) powered by a local LLM via Ollama. Your full workout history is compressed into a structured context prompt that includes your top 15 exercises, current ACWR flags, active plateaus, balance ratios, and streak stats. The LLM is instructed to cite specific exercises, dates, and weights when answering, which makes the responses actually useful rather than generic.

---

## Setup

### Prerequisites

- Node.js 18+
- A [Hevy](https://hevy.com) account with workouts logged
- [Ollama](https://ollama.com) installed locally (for the AI chat feature)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

The `.env` file at the project root needs two variables:

```env
HEVY_API_KEY=your-hevy-api-key-here
OLLAMA_MODEL=qwen3:8b
```

**Getting your Hevy API key:** Go to [app.hevyapp.com](https://app.hevyapp.com), then Settings, then API. Copy the key and paste it into `.env`.

**Choosing an Ollama model:** Run `ollama list` to see what you have installed. Set `OLLAMA_MODEL` to match exactly (e.g. `llama3.2`, `qwen3:8b`, `phi3.5`). If you do not have a model yet:

```bash
ollama pull llama3.2
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. AI chat setup

Ollama must be running before you use the chat panel. If it is not already running as a system service, start it with:

```bash
ollama serve
```

Then click the chat button in the bottom-right corner. If you see a "Model Offline" banner, run `ollama list` and confirm your model name matches `OLLAMA_MODEL` in `.env`.

---

## Data and Caching

All Hevy API calls are made server-side. Your API key is never sent to the browser. Workout data is cached for 2 hours using Next.js ISR. To force a refresh before the cache expires, restart the dev server.

Nutrition data is stored in `data/nutrition.json` at the project root. This file is created automatically on the first save. It is a plain JSON object keyed by date string (`YYYY-MM-DD`), so it is easy to inspect, edit by hand, or back up.

---

## Algorithms

### Volume

All calculations are based on working set volume only. Warmup sets are excluded. Volume for a set is:

```
volume_kg = weight_kg x reps
```

Bodyweight exercises (no `weight_kg`) contribute 0 kg to volume calculations. Muscle group attribution comes from Hevy's exercise template data (`primary_muscle_group` and `secondary_muscle_groups`).

---

### Fatigue and Recovery (ACWR)

The Acute:Chronic Workload Ratio is a sports science model for estimating injury risk and readiness. It compares how hard you have trained recently against your baseline capacity.

**Per muscle group:**

```
acute_load   = sum of working-set volume for that muscle in the last 7 days
chronic_load = (sum of volume in the last 28 days / 28) x 7
ACWR         = acute_load / chronic_load
```

The chronic load is normalized to a 7-day equivalent so the units match. An ACWR of 1.0 means you are training at exactly your baseline rate.

All date boundary comparisons are done using UTC date strings (`YYYY-MM-DD`) anchored to noon UTC to avoid timezone edge cases where workouts near midnight would be counted in the wrong window.

**Status thresholds:**

| ACWR | Status | Meaning |
|------|--------|---------|
| > 1.5 | Danger | Spike in load, elevated injury risk |
| 0.8 to 1.5 | Optimal | Training at or near your baseline |
| < 0.8 | Undertrained | Below your usual volume for this muscle |
| < 2 training days | Insufficient data | Not enough history to compute |

Requires at least 2 distinct training days in the 28-day window to produce a result.

---

### Plateau Detector

Identifies exercises where you have not made meaningful progress for multiple weeks despite consistent training.

**Step 1 - Eligibility:** An exercise must appear at least 3 times in the last 6 weeks. Less frequent training does not produce enough signal.

**Step 2 - Weekly aggregation:** Sessions are bucketed by ISO week. Each week stores the maximum top-set weight, maximum total volume, and maximum reps seen that week.

**Step 3 - Stall detection:** The last 4 weeks are examined. Progress is considered stalled if, across the most recent 3 of those weeks, all three of the following are true compared to the 4th-to-last week:

- Top-set weight has not increased by more than 2%
- Weekly volume has not increased by more than 5%
- Max reps have not increased

The tolerances prevent small rounding-related changes from masking a real stall.

**Step 4 - Deload exclusion:** If the most recent week shows both weight and volume more than 15% below the prior 4-week peak, the exercise is classified as an intentional deload and excluded from plateau flags.

**Step 5 - Stall duration:** The algorithm walks backward through the weekly history counting consecutive weeks with no progress to determine how long the stall has been running.

**Risk levels:**

| Stall duration | Risk |
|----------------|------|
| 4+ weeks | High |
| 2-3 weeks | Medium |
| < 2 weeks | Not flagged |

---

### Strength Balance

Compares volume distribution across movement pattern categories within a configurable time window (30, 90, or 365 days).

**Muscle group classification:**

| Category | Muscles |
|----------|---------|
| Push | chest, shoulders, triceps |
| Pull | back, biceps, rear delts |
| Quad-dominant | quads |
| Hip-dominant | hamstrings, glutes |

Classification uses the primary muscle group of each exercise. Total working-set volume is accumulated per category across all sessions in the period.

**Ratios:**

```
push/pull ratio = push_volume / pull_volume
quad/hip ratio  = quad_volume / hip_volume
```

A ratio of 1.0 means perfectly balanced volume between the two categories.

**Warning thresholds:**

| Condition | Warning |
|-----------|---------|
| push/pull > 2.0 | Too much push relative to pull |
| push/pull < 0.5 | Too much pull relative to push |
| quad/hip > 2.5 | Quad-dominant, insufficient posterior chain work |

---

### Session Quality Score

Each session receives a score from 1-10 computed as the equal-weighted average of three components.

#### Density (0-10)

Measures how much volume you moved per unit of time, a proxy for training efficiency.

```
density = total_volume_kg / duration_minutes
```

Your density is normalized against your personal 90th-percentile density across all sessions:

```
density_score = min(10, (density / p90_density) x 10)
```

A score of 10 means you trained at or above your most efficient sessions.

#### Completeness (0-10)

Measures whether you hit your usual volume for each exercise, based on your last 8 appearances of that exercise.

```
for each exercise in the session:
  ratio = working_sets_today / avg_working_sets_last_8_sessions (capped at 1.0)

completeness_score = mean(ratios) x 10
```

A score of 10 means you matched or exceeded your average set count on every exercise. Defaults to 7 if no prior history exists for any exercise in the session.

#### Timing (0-10)

Rewards adequate recovery time between sessions that train overlapping muscle groups.

The algorithm finds the most recent prior session that hit any of the same muscle groups, then scores based on the gap:

```
gap >= 48 hours       -> 10
24 <= gap < 48 hours  -> 5 + ((gap - 24) / 24) x 5
gap < 24 hours        -> (gap / 24) x 5
```

If no prior session trained overlapping muscles, the gap defaults to 72 hours (score of 10).

**Final score:**

```
score = (density_score + completeness_score + timing_score) / 3
```

Rounded to one decimal place. The chart shows a 7-session rolling average so you can track quality trends without individual outlier sessions dominating the visual.

---

### Consistency Heatmap

Each cell in the 52-week calendar grid represents one day. Cell color intensity is determined by where that day's volume falls relative to the maximum single-day volume in your history:

| Volume (% of max) | Intensity level |
|-------------------|-----------------|
| 0 (rest day) | Grey |
| 1-20% | Level 1 |
| 21-40% | Level 2 |
| 41-65% | Level 3 |
| 66-85% | Level 4 |
| 86-100% | Level 5 |

**Streak calculation:** Current streak walks backward from today, counting consecutive calendar days with at least one workout. Longest streak walks forward through all training dates and counts the longest run of back-to-back days. Average gap is the mean number of days between any two consecutive training days across all history.

---

### Weekly Volume Chart

Sessions are bucketed by UTC Monday to define week boundaries. This avoids ambiguity on weeks that span a month boundary. The current week is flagged with `is_current` so the chart can highlight it separately. The average reference line is computed excluding the current week since it is almost always a partial week.

---

### Personal Records

For each exercise, the best top-set weight (`top_set_weight_kg`) across all recorded sessions is tracked. An entry is flagged as recent if the date of that best performance is within the last 30 days. The list can be sorted by best weight (descending) or most recently set.

---

### AI Coach Context

When you open the chat panel, your full workout history is compressed into a structured text summary and injected into the Ollama system prompt. The summary includes:

- Aggregate stats for the last 90 days (total workouts, volume, average session)
- Per-exercise history for the top 15 most-frequent exercises (recent dates, best weight, volume trend)
- Current ACWR flags (danger/undertrained muscles)
- Active plateau flags
- Push/pull and quad/hip ratios
- Streak and consistency stats

The summary is generated once when the page loads and reused for the entire chat session. The LLM is instructed to reference specific exercises, dates, and weights from the data when answering.

---

## Project Structure

```
/app
  page.tsx                       # Server component, fetches data, runs analytics, renders dashboard
  loading.tsx                    # Skeleton loading state
  layout.tsx                     # Root layout with persistent Navbar
  /nutrition
    page.tsx                     # Nutrition log page (client component)
  /api/hevy/workouts/            # Cached Hevy workout endpoint
  /api/hevy/exercise-templates/  # Cached Hevy templates endpoint
  /api/chat/                     # Streaming Ollama SSE endpoint
  /api/nutrition/                # File-backed nutrition CRUD endpoint

/components
  Navbar.tsx                     # Sticky top navigation with active route detection
  ConsistencyHeatmap.tsx         # 52-week training calendar with day labels
  AcwrChart.tsx                  # Per-muscle ACWR bars with status chips
  PlateauCards.tsx               # Stalled exercise detection cards
  BalanceAnalyzer.tsx            # Push/pull and quad/hip ratio analyzer
  SessionQuality.tsx             # Session quality trend chart with rolling average
  WeeklyVolume.tsx               # 16-week volume bar chart with average reference line
  PersonalRecords.tsx            # Sortable, paginated PR list
  NutritionCalendar.tsx          # Month-view calendar for nutrition date selection
  NutritionDashboardWidget.tsx   # 7-day nutrition summary widget for the dashboard
  ChatPanel.tsx                  # AI coach chat panel
  Skeleton.tsx
  DangerBadge.tsx

/lib
  hevy.ts        # Hevy API client, all types, enrichment pipeline
  analytics.ts   # Pure analytics functions (ACWR, plateau, balance, quality, heatmap, volume, PRs)
  summarize.ts   # LLM context compressor
  nutrition.ts   # Nutrition types and API fetch helpers

/remotion
  index.ts       # Remotion entry point
  Root.tsx       # Composition definition (1920x1080, 30fps)
  Walkthrough.tsx # Full 9-scene UI walkthrough video

/data
  nutrition.json # File-backed nutrition log (auto-created on first save)
```
