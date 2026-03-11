# Hevy Training Intelligence Dashboard

A workout analytics dashboard that surfaces deeper training patterns from your [Hevy](https://hevy.com) data. Goes beyond Hevy's built-in stats to show fatigue trends, plateau detection, strength balance, and an AI coach you can chat with about your training.

---

## Features

- **Fatigue & Recovery** — Per-muscle ACWR (Acute:Chronic Workload Ratio) with danger/optimal/undertrained flags
- **Plateau Detector** — Identifies exercises where you've stalled for 2+ weeks with no meaningful progress
- **Consistency Heatmap** — GitHub-style full-year calendar showing training days and volume intensity
- **Strength Balance** — Push/pull and quad/hip volume ratios over 30-, 90-, or 365-day windows
- **Session Quality Score** — Scores each session 1–10 based on density, completeness, and recovery timing
- **AI Coach Chat** — Chat with a local LLM (via Ollama) that has your full training history in context

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

**Getting your Hevy API key:** Go to [app.hevyapp.com](https://app.hevyapp.com) → Settings → API. Copy the key and paste it in `.env`.

**Choosing an Ollama model:** Run `ollama list` to see what you have installed. Set `OLLAMA_MODEL` to match exactly (e.g. `llama3.2`, `qwen3:8b`, `phi3.5`). If you don't have a model yet:

```bash
ollama pull llama3.2
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. AI chat setup

Ollama must be running in the background before using the chat panel. If it isn't already running as a system service, start it with:

```bash
ollama serve
```

Then click the chat button (bottom-right corner of the dashboard). If you see a "Model Offline" banner, run `ollama list` to confirm your model name matches `OLLAMA_MODEL` in `.env`.

---

## Data & Caching

All Hevy API calls are made server-side — your API key is never exposed to the browser. Workout data is cached for 2 hours using Next.js ISR. To force a refresh before the cache expires, restart the dev server.

---

## Algorithms

### Volume

All calculations are based on **working set volume** only. Warmup sets are excluded. Volume for a set is:

```
volume_kg = weight_kg × reps
```

Bodyweight exercises (no `weight_kg`) contribute 0 kg to volume calculations. Muscle group attribution comes from Hevy's exercise template data (`primary_muscle_group` and `secondary_muscle_groups`).

---

### Fatigue & Recovery — ACWR

The **Acute:Chronic Workload Ratio** is a sports science model for estimating injury risk and readiness. It compares how hard you've trained recently vs. your baseline capacity.

**Per muscle group:**

```
acute_load  = sum of working-set volume for that muscle in the last 7 days
chronic_load = (sum of volume in the last 28 days / 28) × 7
ACWR = acute_load / chronic_load
```

The chronic load is normalized to a 7-day equivalent so the units match. This means an ACWR of 1.0 represents training at exactly your baseline rate.

**Status thresholds:**

| ACWR | Status | Meaning |
|------|--------|---------|
| > 1.5 | Danger | Spike in load — elevated injury risk |
| 0.8 – 1.5 | Optimal | Training at or near your baseline |
| < 0.8 | Undertrained | Below your usual volume for this muscle |
| < 2 training days | Insufficient data | Not enough history to compute |

Requires at least 2 distinct training days in the 28-day window to produce a result.

---

### Plateau Detector

Identifies exercises where you haven't made meaningful progress for multiple weeks despite consistent training.

**Step 1 — Eligibility:** An exercise must appear at least 3 times in the last 6 weeks. Less frequent training doesn't produce enough signal.

**Step 2 — Weekly aggregation:** Sessions are bucketed by ISO week. Each week stores the maximum top-set weight, maximum total volume, and maximum reps seen that week.

**Step 3 — Stall detection:** The last 4 weeks are examined. Progress is considered stalled if, across the most recent 3 of those weeks, **all three** of the following are true compared to the 4th-to-last week:

- Top-set weight has not increased by more than 2%
- Weekly volume has not increased by more than 5%
- Max reps have not increased

The tolerances (2% weight, 5% volume) prevent small rounding-related changes from masking a real stall.

**Step 4 — Deload exclusion:** If the most recent week shows both weight **and** volume more than 15% below the prior 4-week peak, the exercise is classified as an intentional deload and excluded from plateau flags.

**Step 5 — Stall duration:** The algorithm walks backward through the weekly history counting consecutive weeks with no progress to determine how long the stall has been running.

**Risk levels:**

| Stall duration | Risk |
|---------------|------|
| 4+ weeks | High |
| 2–3 weeks | Medium |
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

Classification uses the **primary** muscle group of each exercise. Total working-set volume is accumulated per category across all sessions in the period.

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
| quad/hip > 2.5 | Quad-dominant — insufficient posterior chain work |

---

### Session Quality Score

Each session receives a score from 1–10 computed as the equal-weighted average of three components.

#### Density (0–10)

Measures how much volume you moved per unit of time — a proxy for training efficiency.

```
density = total_volume_kg / duration_minutes
```

Your density is then normalized against your personal 90th-percentile density across all sessions:

```
density_score = min(10, (density / p90_density) × 10)
```

A score of 10 means you trained at or above your most efficient sessions. Scores are capped at 10 so unusually high days don't skew averages.

#### Completeness (0–10)

Measures whether you hit your usual volume for each exercise, based on your last 8 appearances of that exercise.

```
for each exercise in the session:
  ratio = working_sets_today / avg_working_sets_last_8_sessions (capped at 1.0)

completeness_score = mean(ratios) × 10
```

A score of 10 means you matched or exceeded your average set count on every exercise. Defaults to 7 if no prior history exists for any exercise in the session.

#### Timing (0–10)

Rewards adequate recovery time between sessions that train overlapping muscle groups.

The algorithm finds the most recent prior session that hit any of the same muscle groups, then scores based on the gap between that session's end time and this session's start time:

```
gap ≥ 48 hours → 10   (well recovered)
24 ≤ gap < 48  → 5 + ((gap - 24) / 24) × 5   (partial recovery, linear 5→10)
gap < 24 hours → (gap / 24) × 5               (same-day or next-day, linear 0→5)
```

If no prior session trained overlapping muscles, the gap defaults to 72 hours (score of 10).

**Final score:**

```
score = (density_score + completeness_score + timing_score) / 3
```

Rounded to one decimal place.

---

### Consistency Heatmap

Each cell in the 52-week calendar grid represents one day. Cell color intensity is determined by where that day's volume falls relative to the maximum single-day volume in your history:

| Volume (% of max) | Intensity level |
|-------------------|----------------|
| 0 (rest day) | Grey |
| 1–20% | Level 1 |
| 21–40% | Level 2 |
| 41–65% | Level 3 |
| 66–85% | Level 4 |
| 86–100% | Level 5 |

**Streak calculation:** Current streak walks backward from today, counting consecutive calendar days with at least one workout. Longest streak walks forward through all training dates and counts the longest run of back-to-back days. Average gap is the mean number of days between any two consecutive training days across all history.

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
  page.tsx                     # Server component — fetches data, runs analytics, renders dashboard
  loading.tsx                  # Skeleton loading state
  /api/hevy/workouts/          # Cached Hevy workout endpoint
  /api/hevy/exercise-templates/ # Cached Hevy templates endpoint
  /api/chat/                   # Streaming Ollama SSE endpoint
/components
  ConsistencyHeatmap.tsx
  AcwrChart.tsx
  PlateauCards.tsx
  BalanceAnalyzer.tsx
  SessionQuality.tsx
  ChatPanel.tsx
  Skeleton.tsx
  DangerBadge.tsx
/lib
  hevy.ts        # Hevy API client, all types, enrichment pipeline
  analytics.ts   # Pure analytics functions (ACWR, plateau, balance, quality, heatmap)
  summarize.ts   # LLM context compressor
```
