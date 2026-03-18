# Gauge

A personal training intelligence dashboard built on Next.js 16. Gauge connects to your Hevy workout history and WHOOP biometric data, runs a full analytics pipeline, and surfaces actionable insights through six dedicated pages covering training, recovery, nutrition, and AI coaching.

https://github.com/user-attachments/assets/0a2b0d2b-637d-4dea-910e-8a61e21cd40e

---

## Pages

| Route        | Purpose                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `/`          | Command center: weekly stats bar, recovery signal, plateau alerts, nutrition strip, 52-week heatmap        |
| `/training`  | Workout analytics: volume trends, 1RM progression, plateau detection, session quality scoring              |
| `/recovery`  | Biometrics and readiness: Whoop recovery scores, HRV, sleep breakdown, muscle readiness, push/pull balance |
| `/nutrition` | Daily nutrition log: calories, macros, 7-day calendar, rolling averages                                    |
| `/coach`     | Full-page AI coaching powered by a local Ollama model with complete training context                       |
| `/profile`   | Body metrics, training goal, experience level, notes for the AI coach, and Whoop connection                |

---

## Features

### Dashboard

- Five-cell stats bar showing sessions this week, monthly volume, current streak, all-time workout count, and 12-week muscle coverage score
- Recovery signal card with today's Whoop recovery percentage, HRV, and resting heart rate
- Plateau alert card with active stall count and the top offending exercise
- Nutrition strip showing 7-day average calories and protein
- 52-week consistency heatmap with streak and gap statistics

### Training Analytics

- Weekly volume bar chart across the last 16 weeks with a dashed average reference line
- Personal records table showing the best top-set weight per exercise
- Estimated 1RM progression chart using the Epley formula across your full history
- Overload suggestions based on recent progression rate per exercise
- Plateau detection identifying exercises stalled for three or more weeks, classified as low, medium, or high risk
- Session quality scoring (0 to 10) based on training density, exercise completeness, and recovery timing, displayed with a 7-session rolling average trend line

### Recovery

- Whoop recovery card: today's recovery score, resting heart rate, HRV, 7-day trend sparkline, and 7-day HRV average
- 30-day recovery trend chart
- Sleep breakdown by stage (deep, REM, light, awake) from the most recent sleep record
- Whoop activities log showing sport-tagged workout sessions from the wearable
- Muscle readiness chart: per-muscle-group readiness score from 0 to 100 computed from recency and volume of recent training load
- Balance analyzer: push/pull ratio and quad/hip ratio over a configurable window with overuse warnings

### Nutrition

- Month-view calendar for selecting any day to log
- Daily entry form for calories, protein, carbohydrates, fat, fiber, water, and notes
- Stacked macro proportion bar that updates live as you type
- 7-day chip grid with per-day calorie and protein totals
- Rolling weekly averages for all four macros
- Automatic recovery insight copy assessing protein adequacy and caloric sufficiency

### AI Coach

- Full-page chat interface at `/coach` with suggested starter questions
- Streaming responses via Server-Sent Events from a local Ollama model
- System prompt includes the complete workout history summary, Whoop biometric summary, nutrition log summary, user profile, ACWR flags, plateau flags, and push/pull ratios
- Whoop-specific questions are surfaced in the suggestions when biometric data is connected
- Also accessible as a floating panel on the training page via the same underlying chat component

### Profile

- Name, age, sex, height, current weight, and goal weight stored in kg and displayed in the selected unit
- BMI computed and categorized automatically
- Training goal selector: strength, hypertrophy, fat loss, endurance, general fitness
- Experience level selector: beginner, intermediate, advanced
- Free-text notes field passed directly to the AI coach system prompt
- Whoop OAuth connect and disconnect controls

---

## Integrations

### Hevy

Gauge uses the Hevy public REST API to pull your complete workout history and exercise template library. All API calls are made server-side and your key is never sent to the browser. Workout data is cached with a two-hour revalidation window.

Required environment variable:

```
HEVY_API_KEY=your_hevy_api_key
```

To get your Hevy API key: go to [app.hevyapp.com](https://app.hevyapp.com), then Settings, then API.

### WHOOP

Gauge integrates with the Whoop Developer API using the OAuth 2.0 authorization code flow. When connected, it fetches recovery cycles, sleep records, and sport-tagged workout sessions. Hevy and Whoop sessions that overlap in time are deduplicated and merged so each Hevy session is enriched with the corresponding Whoop recovery score, HRV, and sleep data.

The OAuth token is persisted to `data/whoop-tokens.json`. A webhook endpoint at `/api/webhooks/whoop` supports push-based cache revalidation when new recovery data is available from Whoop.

Required environment variables:

```
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/whoop/callback
```

### Ollama

The AI coaching feature uses a locally running Ollama instance. No data leaves your machine. Gauge sends a structured system prompt containing all computed analytics and streams the model response token by token via SSE.

Required environment variables:

```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Set `OLLAMA_MODEL` to any model name returned by `ollama list`. Run `ollama pull <model>` to download a model before using the coach.

---

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Create a `.env` file at the project root:

```env
HEVY_API_KEY=

WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/whoop/callback

OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Only `HEVY_API_KEY` is required. Whoop and Ollama degrade gracefully when not configured: the recovery page shows readiness data without biometrics, and the coach page shows a connection error banner instead of crashing.

**3. Pull an Ollama model**

```bash
ollama pull llama3.2
ollama serve
```

**4. Start the development server**

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

**5. Connect Whoop (optional)**

Navigate to `/profile` and click "Connect Whoop". You will be redirected through the Whoop OAuth consent screen and returned to the profile page. After connecting, biometric data will appear on the recovery page and will be used to enrich training sessions and the AI coach context.

---

## Scripts

| Command                   | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `npm run dev`             | Start the Next.js development server                      |
| `npm run build`           | Build for production                                      |
| `npm run start`           | Start the production server                               |
| `npm run lint`            | Run ESLint                                                |
| `npm run remotion:studio` | Open the Remotion studio to preview the walkthrough video |
| `npm run remotion:render` | Render the walkthrough to `out/walkthrough.mp4`           |

---

## Algorithms

### Volume

All calculations use working sets only. Warmup sets are excluded. Volume for a set is `weight_kg x reps`. Bodyweight exercises with no recorded weight contribute 0 kg to volume totals. Muscle group attribution comes from Hevy's exercise template data via `primary_muscle_group` and `secondary_muscle_groups`.

### ACWR (Fatigue and Recovery)

The Acute:Chronic Workload Ratio compares recent training load against a longer-term baseline, per muscle group.

```
acute_load   = volume for that muscle in the last 7 days
chronic_load = (volume in the last 28 days / 28) x 7
ACWR         = acute_load / chronic_load
```

| ACWR              | Status            |
| ----------------- | ----------------- |
| > 1.5             | Danger            |
| 0.8 to 1.5        | Optimal           |
| < 0.8             | Undertrained      |
| < 2 training days | Insufficient data |

All date boundaries use UTC date strings anchored to noon UTC to avoid timezone edge cases.

### Plateau Detection

**Eligibility:** An exercise must appear at least three times in the last six weeks.

**Aggregation:** Sessions are bucketed by ISO week. Each week stores the maximum top-set weight, maximum total volume, and maximum reps.

**Stall detection:** The last four weeks are examined. A stall is declared if, across the most recent three weeks, top-set weight has not increased by more than 2%, weekly volume has not increased by more than 5%, and max reps have not increased.

**Deload exclusion:** If the most recent week shows both weight and volume more than 15% below the prior four-week peak, the exercise is treated as a deliberate deload and is excluded from plateau flags.

| Stall duration | Risk        |
| -------------- | ----------- |
| 4+ weeks       | High        |
| 2 to 3 weeks   | Medium      |
| Under 2 weeks  | Not flagged |

### Strength Balance

Push/pull and quad/hip volume ratios are computed over a configurable window (30, 90, or 365 days) using the primary muscle group of each exercise.

| Ratio           | Warning threshold            |
| --------------- | ---------------------------- |
| Push/pull > 2.0 | Excessive push volume        |
| Push/pull < 0.5 | Excessive pull volume        |
| Quad/hip > 2.5  | Insufficient posterior chain |

### Session Quality Score

Each session is scored from 0 to 10 as the equal-weighted average of three components.

**Density (0-10):** Volume per minute normalized against your personal 90th-percentile density across all sessions.

**Completeness (0-10):** For each exercise in the session, working sets are compared to your average over the last eight appearances. The mean ratio across all exercises, capped at 1.0, is multiplied by 10.

**Timing (0-10):** Based on the recovery gap since the last session that trained overlapping muscle groups.

```
gap >= 48 hours       -> 10
24 <= gap < 48 hours  -> 5 + ((gap - 24) / 24) x 5
gap < 24 hours        -> (gap / 24) x 5
```

### Consistency Heatmap

Each day is colored by volume relative to the maximum single-day volume in your history, across five intensity levels. Streak calculation walks backward from today counting consecutive calendar days with at least one workout. Average gap is the mean number of days between consecutive training dates across all history.

### AI Coach Context

When the coach loads, your workout history is compressed into a structured text prompt that includes aggregate stats for the last 90 days, per-exercise history for the 15 most frequent exercises, current ACWR flags, active plateau flags, push/pull and quad/hip ratios, and streak statistics. The Whoop summary, nutrition summary, and profile notes are appended when available. The model is instructed to reference specific exercises, dates, and weights when answering.

---

## Architecture

```
app/
  page.tsx                      Dashboard command center (server component, force-dynamic)
  training/page.tsx             Training analytics page (server component)
  recovery/page.tsx             Recovery and biometrics page (server component)
  coach/page.tsx                Full-page AI coach (server component)
  nutrition/page.tsx            Nutrition log (client component)
  profile/page.tsx              User profile (client component)
  loading.tsx                   Global skeleton loading state
  layout.tsx                    Root layout with Navbar and unit provider

  api/
    chat/route.ts               Streaming Ollama SSE endpoint
    hevy/workouts/              Cached Hevy workout proxy
    hevy/exercise-templates/    Cached Hevy template proxy
    auth/whoop/                 OAuth 2.0 initiation, callback, status, and disconnect
    webhooks/whoop/             Push revalidation from Whoop
    nutrition/route.ts          Nutrition log read and write
    profile/route.ts            Profile read and write

lib/
  hevy.ts                       Hevy API client, all types, enrichWorkouts, muscle group mapping
  analytics.ts                  ACWR, plateau detection, balance, session quality, heatmap, streaks, 1RM, overload
  whoop-server.ts               Whoop API client, token management, caching, deduplication, summarizer
  summarize.ts                  LLM context builder for workout history
  nutrition-server.ts           Server-side nutrition log reader and summarizer
  profile-server.ts             Server-side profile reader and summarizer
  nutrition.ts                  Client-side nutrition fetch, types, and utilities
  profile.ts                    Client-side profile fetch and save
  units.ts                      KG/LB toggle context provider and conversion utilities

components/
  Navbar.tsx                    Fixed header with six-page navigation and unit toggle
  DashSection.tsx               Shared section header with label and horizontal rule
  ChatPanel.tsx                 Floating FAB and slide-in drawer wrapping ChatInterface
  ChatInterface.tsx             Stateless chat UI with SSE streaming and Markdown rendering
  RecoverySignalCard.tsx        Compact Whoop today-score card for the dashboard
  NutritionStrip.tsx            7-day average calories and protein strip for the dashboard
  ConsistencyHeatmap.tsx        52-week calendar heatmap with streak statistics
  WeeklyVolume.tsx              16-week volume bar chart
  OneRMChart.tsx                Estimated 1RM progression line chart
  OverloadSuggestions.tsx       Progressive overload recommendations per exercise
  PlateauCards.tsx              Stalled exercise alert cards
  SessionQuality.tsx            Per-session quality scatter and rolling average line
  MuscleReadinessChart.tsx      Per-muscle readiness bar chart
  BalanceAnalyzer.tsx           Push/pull and quad/hip ratio analysis
  WhoopRecoveryCard.tsx         Today's recovery score, HRV, RHR, and 7-day trend dots
  WhoopRecoveryTrend.tsx        30-day recovery trend chart
  WhoopSleepBreakdown.tsx       Sleep stage breakdown bar from the most recent night
  WhoopActivitiesLog.tsx        Whoop sport-tagged activity log
  WhoopConnectButton.tsx        OAuth connect and disconnect control
  NutritionDashboardWidget.tsx  Full 7-day nutrition widget for the nutrition page
  PersonalRecords.tsx           Best weight per exercise list
  VolumeStatCard.tsx            Monthly volume stat cell with unit conversion

remotion/
  index.ts                      Remotion entry point
  Root.tsx                      Composition definition (1920x1080, 30fps)
  Walkthrough.tsx               Eight-scene product walkthrough video
```

---

## Data Storage

All user data is stored locally. No data is sent to any third-party service outside of the Hevy and Whoop APIs used for retrieval.

| Data               | Location                 |
| ------------------ | ------------------------ |
| Whoop OAuth tokens | `data/whoop-tokens.json` |
| Nutrition log      | `data/nutrition.json`    |
| User profile       | `data/profile.json`      |

These files are created automatically on first use. They are plain JSON and can be inspected, edited by hand, or backed up without tooling.

---

## Tech Stack

- **Framework:** Next.js 16 with the App Router and React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with CSS custom properties for design tokens
- **Charts:** Recharts
- **AI:** Ollama (local inference, fully offline)
- **Fonts:** Space Grotesk (display), JetBrains Mono (monospace)
- **Video:** Remotion 4 for the product walkthrough
- **Data sources:** Hevy REST API, Whoop Developer API
