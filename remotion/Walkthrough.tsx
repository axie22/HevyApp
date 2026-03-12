import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Series,
} from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#09090b',
  card: '#18181b',
  cardHover: '#1c1c1f',
  border: '#27272a',
  muted: '#52525b',
  dim: '#71717a',
  sub: '#a1a1aa',
  text: '#f4f4f5',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  indigo100: '#e0e7ff',
  emerald: '#22c55e',
  emeraldDim: '#166534',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#60a5fa',
  rose: '#fb7185',
};

// Scene durations (frames at 30fps)
const D = {
  intro: 90,
  stats: 120,
  heatmap: 105,
  acwr: 120,
  volume: 120,
  quality: 105,
  nutrition: 150,
  coach: 120,
  outro: 90,
};

const TRANSITION_FRAMES = 18;

// Total = sum(scenes) - transitions*(n-1)
// 8 transitions between 9 scenes
export const TOTAL_FRAMES =
  Object.values(D).reduce((s, v) => s + v, 0) -
  TRANSITION_FRAMES * 8;

// ─── Animation helpers ─────────────────────────────────────────────────────────

function useFadeIn(delay = 0, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function useSlideUp(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
    translateY: interpolate(progress, [0, 1], [24, 0]),
  };
}

function useSpringIn(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

const Card: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

const SceneLabel: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const opacity = useFadeIn(delay);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity,
        color: C.dim,
        fontSize: 22,
        letterSpacing: 1,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {text}
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; subtitle?: string; delay?: number }> = ({
  title,
  subtitle,
  delay = 0,
}) => {
  const { opacity, translateY } = useSlideUp(delay);
  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, marginBottom: 32 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: C.text,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 16, color: C.dim, fontFamily: 'system-ui, sans-serif' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// ─── Scene 1: Intro ────────────────────────────────────────────────────────────

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [35, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badgesOpacity = interpolate(frame, [55, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Icon */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 32,
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'rgba(99,102,241,0.15)',
          border: `1px solid rgba(99,102,241,0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 72,
          fontWeight: 800,
          color: C.text,
          letterSpacing: -2,
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Training Intelligence
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 28,
          color: C.dim,
          marginBottom: 48,
          textAlign: 'center',
        }}
      >
        Workout analytics · Recovery tracking · AI coaching
      </div>

      {/* Tech badges */}
      <div style={{ opacity: badgesOpacity, display: 'flex', gap: 12 }}>
        {['Next.js 16', 'Hevy API', 'Ollama AI', 'Recharts'].map((badge) => (
          <div
            key={badge}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.sub,
              fontSize: 14,
            }}
          >
            {badge}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Dashboard Stats ──────────────────────────────────────────────────

const StatsScene: React.FC = () => {
  const stats = [
    { label: 'This Week', value: '4', unit: 'sessions', color: C.indigoLight },
    { label: 'This Month', value: '8,240', unit: 'kg lifted', color: C.emerald },
    { label: 'Current Streak', value: '7', unit: 'days', color: C.amber },
    { label: 'All-time', value: '127', unit: 'workouts', color: C.text },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle
        title="At a Glance"
        subtitle="Key training metrics always at the top of your dashboard"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {stats.map(({ label, value, unit, color }, i) => {
          const { opacity, translateY } = useSlideUp(i * 12 + 10);
          return (
            <div
              key={label}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: 32,
              }}
            >
              <div style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label}</div>
              <div style={{ fontSize: 52, fontWeight: 800, color, marginBottom: 6, letterSpacing: -1 }}>{value}</div>
              <div style={{ fontSize: 14, color: C.dim }}>{unit}</div>
            </div>
          );
        })}
      </div>

      {/* Mini heatmap preview below */}
      <HeatmapPreview delay={40} />

      <SceneLabel text="At-a-glance metrics + 52-week consistency heatmap" delay={70} />
    </AbsoluteFill>
  );
};

function HeatmapPreview({ delay = 0 }: { delay?: number }) {
  const frame = useCurrentFrame();
  const cols = 32;
  const rows = 7;

  // Seed deterministic "random" values
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const noise = ((i * 2654435761) >>> 0) % 256;
    return noise / 255;
  });

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }}>
        {cells.map((val, i) => {
          const col = Math.floor(i / rows);
          const appearsAt = delay + col * 2;
          const opacity = interpolate(frame, [appearsAt, appearsAt + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const level = val < 0.4 ? 0 : val < 0.6 ? 1 : val < 0.75 ? 2 : val < 0.9 ? 3 : 4;
          const colors = ['#27272a', '#166534', '#15803d', '#16a34a', '#22c55e'];
          return (
            <div
              key={i}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 3,
                background: colors[level],
                opacity,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene 3: Heatmap (full) ───────────────────────────────────────────────────

const HeatmapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = 53;
  const rows = 7;

  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const noise = ((i * 1664525 + 1013904223) >>> 0) % 256;
    return noise / 255;
  });

  const streakOpacity = useFadeIn(60);

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle title="Workout Consistency" subtitle="52-week heatmap — every workout logged in Hevy" />

      <Card style={{ padding: 32 }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 8, paddingLeft: 32 }}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
            <div key={m} style={{ flex: 1, fontSize: 11, color: C.muted }}>{m}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <div key={i} style={{ height: 14, fontSize: 11, color: C.muted, textAlign: 'right', lineHeight: '14px' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }}>
            {cells.map((val, i) => {
              const col = Math.floor(i / rows);
              const appearsAt = col * 1.2;
              const opacity = interpolate(frame, [appearsAt, appearsAt + 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const level = val < 0.45 ? 0 : val < 0.6 ? 1 : val < 0.75 ? 2 : val < 0.88 ? 3 : 4;
              const colors = ['#27272a', '#14532d', '#166534', '#15803d', '#22c55e'];
              return (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 2,
                    background: colors[level],
                    opacity,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 32,
            opacity: streakOpacity,
          }}
        >
          {[
            { label: 'Current streak', value: '7 days' },
            { label: 'Longest streak', value: '23 days' },
            { label: 'Avg gap', value: '1.4 days' },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: 14, color: C.dim }}>
              {label}: <span style={{ color: C.text, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <SceneLabel text="Streak tracking · Volume per session · 52-week history" delay={75} />
    </AbsoluteFill>
  );
};

// ─── Scene 4: ACWR ─────────────────────────────────────────────────────────────

interface AcwrBar {
  muscle: string;
  ratio: number;
  status: 'optimal' | 'danger' | 'undertrained';
}

const ACWR_DATA: AcwrBar[] = [
  { muscle: 'Chest', ratio: 1.32, status: 'optimal' },
  { muscle: 'Back', ratio: 1.08, status: 'optimal' },
  { muscle: 'Quads', ratio: 1.71, status: 'danger' },
  { muscle: 'Shoulders', ratio: 0.54, status: 'undertrained' },
  { muscle: 'Hamstrings', ratio: 0.91, status: 'optimal' },
  { muscle: 'Biceps', ratio: 1.22, status: 'optimal' },
];

function statusColor(s: AcwrBar['status']) {
  return s === 'danger' ? C.red : s === 'optimal' ? C.emerald : C.amber;
}
function statusLabel(s: AcwrBar['status']) {
  return s === 'danger' ? 'Danger' : s === 'optimal' ? 'Optimal' : 'Undertrained';
}

const AcwrScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle
        title="Fatigue & Recovery"
        subtitle="Acute:Chronic Workload Ratio — 7-day vs 28-day training load"
      />

      <Card>
        {/* Warning banner */}
        {(() => {
          const opacity = useFadeIn(30);
          return (
            <div
              style={{
                opacity,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 24,
                fontSize: 14,
                color: '#fca5a5',
              }}
            >
              1 danger · Quads ACWR at 1.71 — consider reducing leg volume this week
            </div>
          );
        })()}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ACWR_DATA.map(({ muscle, ratio, status }, i) => {
            const barProgress = spring({ frame: frame - (i * 8 + 20), fps, config: { damping: 200 } });
            const rowOpacity = interpolate(frame, [i * 8 + 10, i * 8 + 30], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const barWidth = interpolate(barProgress, [0, 1], [0, Math.min((ratio / 2) * 100, 100)]);
            const color = statusColor(status);

            return (
              <div key={muscle} style={{ opacity: rowOpacity }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{muscle}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: C.dim }}>{Math.round(ratio * 100 * 4)} / {Math.round(ratio * 100)} kg</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{ratio.toFixed(2)}</span>
                    <span style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}30`,
                    }}>
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 6, borderRadius: 999, background: '#27272a' }}>
                  {/* Optimal zone shading */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: '35%', background: 'rgba(63,63,70,0.5)', borderRadius: 4 }} />
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0,
                    width: `${barWidth}%`,
                    background: color,
                    borderRadius: 999,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
          <span>0</span><span>0.8 (undertrained)</span><span>1.5 (danger)</span><span>2.0+</span>
        </div>
      </Card>

      <SceneLabel text="Tracks 7-day vs 28-day load per muscle · Prevents overtraining" delay={90} />
    </AbsoluteFill>
  );
};

// ─── Scene 5: Weekly Volume + Personal Records ─────────────────────────────────

const WEEKLY_VOL = [2100, 3400, 1800, 4200, 3900, 2600, 5100, 4700, 3200, 5800, 4900, 6200, 5400, 7100, 6800, 0];
const PRS = [
  { exercise: 'Deadlift', kg: 182.5 },
  { exercise: 'Back Squat', kg: 142.5 },
  { exercise: 'Bench Press', kg: 102.5 },
  { exercise: 'Overhead Press', kg: 72.5 },
  { exercise: 'Barbell Row', kg: 97.5 },
];

const VolumeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxVol = Math.max(...WEEKLY_VOL);

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle title="Volume & Records" subtitle="Weekly training load · Personal bests" />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Bar chart */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>Weekly Volume</div>
          <div style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>Last 16 weeks</div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200 }}>
            {WEEKLY_VOL.map((vol, i) => {
              const isCurrent = i === WEEKLY_VOL.length - 1;
              const barProgress = spring({ frame: frame - i * 3 - 10, fps, config: { damping: 200 } });
              const height = interpolate(barProgress, [0, 1], [0, vol === 0 ? 4 : (vol / maxVol) * 200]);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height,
                    borderRadius: '3px 3px 0 0',
                    background: isCurrent ? C.indigo : C.emerald,
                    opacity: vol === 0 ? 0.15 : isCurrent ? 0.9 : 0.65,
                    alignSelf: 'flex-end',
                  }}
                />
              );
            })}
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
            <span>16 weeks ago</span>
            <span style={{ color: C.indigoLight }}>↑ This week</span>
          </div>
        </Card>

        {/* PRs */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>Personal Records</div>
          <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Best weight per exercise</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRS.map(({ exercise, kg }, i) => {
              const { opacity, translateY } = useSlideUp(i * 10 + 20);
              return (
                <div
                  key={exercise}
                  style={{
                    opacity,
                    transform: `translateY(${translateY}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#09090b',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: 13, color: C.sub }}>{exercise}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{kg} kg</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <SceneLabel text="16-week volume trend · Top lifts sorted by weight or recency" delay={90} />
    </AbsoluteFill>
  );
};

// ─── Scene 6: Session Quality ──────────────────────────────────────────────────

const QUALITY_SCORES = [6.8, 7.2, 5.9, 8.1, 7.5, 6.3, 8.4, 7.8, 6.5, 8.7, 7.1, 8.2, 7.9, 6.4, 8.5, 7.3, 8.8, 7.6, 9.0, 8.3];

const QualityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineProgress = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 60 });
  const pointsToShow = Math.floor(interpolate(lineProgress, [0, 1], [0, QUALITY_SCORES.length]));

  const W = 800;
  const H = 200;
  const padX = 20;
  const padY = 20;

  function scoreColor(s: number) {
    return s >= 7.5 ? C.emerald : s >= 5 ? C.amber : C.red;
  }

  const points = QUALITY_SCORES.map((s, i) => ({
    x: padX + (i / (QUALITY_SCORES.length - 1)) * (W - padX * 2),
    y: padY + (1 - (s - 4) / 6) * (H - padY * 2),
    score: s,
  }));

  const visiblePoints = points.slice(0, pointsToShow + 1);
  const pathD = visiblePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Rolling avg
  const rollingAvg = QUALITY_SCORES.map((_, i) => {
    const window = QUALITY_SCORES.slice(Math.max(0, i - 6), i + 1);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });
  const avgPoints = rollingAvg.slice(0, pointsToShow + 1);
  const avgPathD = avgPoints.map((v, i) => {
    const p = points[i];
    const y = padY + (1 - (v - 4) / 6) * (H - padY * 2);
    return `${i === 0 ? 'M' : 'L'}${p.x},${y}`;
  }).join(' ');

  const avgScore = QUALITY_SCORES.reduce((a, b) => a + b, 0) / QUALITY_SCORES.length;
  const avgOpacity = useFadeIn(10);

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 6 }}>Session Quality</div>
          <div style={{ fontSize: 16, color: C.dim }}>Density · Completeness · Timing per session</div>
        </div>
        <div style={{ opacity: avgOpacity, textAlign: 'right' }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: C.emerald, lineHeight: 1 }}>{avgScore.toFixed(1)}</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>avg score / 10</div>
        </div>
      </div>

      <Card>
        <svg width="100%" viewBox={`0 0 ${W} ${H + padY * 2}`} style={{ display: 'block' }}>
          {/* Grid lines */}
          {[5, 7.5].map((y) => {
            const cy = padY + (1 - (y - 4) / 6) * (H - padY * 2);
            return (
              <line key={y} x1={padX} x2={W - padX} y1={cy} y2={cy}
                stroke={y === 7.5 ? C.emerald : C.amber} strokeDasharray="4 3" strokeOpacity={0.3} strokeWidth={1} />
            );
          })}

          {/* Session score line */}
          {pathD && <path d={pathD} fill="none" stroke="#52525b" strokeWidth={1.5} />}

          {/* Rolling avg line */}
          {avgPathD && <path d={avgPathD} fill="none" stroke={C.indigo} strokeWidth={2.5} />}

          {/* Dots */}
          {visiblePoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5} fill={scoreColor(p.score)} stroke={C.bg} strokeWidth={1.5} />
          ))}
        </svg>

        <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 13, color: C.dim }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 20, height: 2.5, background: C.indigo, borderRadius: 2 }} />
            7-session rolling avg
          </span>
          {[['Good ≥7.5', C.emerald], ['Fair 5–7.5', C.amber], ['Poor <5', C.red]].map(([l, c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c }} />
              {l}
            </span>
          ))}
        </div>
      </Card>

      <SceneLabel text="Each session scored 0–10 · Rolling trend line shows improvement over time" delay={75} />
    </AbsoluteFill>
  );
};

// ─── Scene 7: Nutrition ────────────────────────────────────────────────────────

const NutritionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formProgress = spring({ frame: frame - 15, fps, config: { damping: 200 } });
  const macroProgress = spring({ frame: frame - 45, fps, config: { damping: 200 } });

  const calOpacity = useFadeIn(20);
  const macroBarOpacity = useFadeIn(50);

  const PROTEIN_PCT = 0.31;
  const CARBS_PCT = 0.46;
  const FAT_PCT = 0.23;

  const pWidth = interpolate(macroProgress, [0, 1], [0, PROTEIN_PCT * 100]);
  const cWidth = interpolate(macroProgress, [0, 1], [0, CARBS_PCT * 100]);
  const fWidth = interpolate(macroProgress, [0, 1], [0, FAT_PCT * 100]);

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle title="Nutrition Log" subtitle="Track calories, macros & hydration to enhance recovery" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Calendar */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, textAlign: 'center', marginBottom: 16 }}>
            March 2026
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Leading empties (March 2026 starts on Sunday) */}
            {Array.from({ length: 6 }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: 25 }).map((_, i) => {
              const day = i + 1;
              const hasData = [1, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15, 17, 18, 20, 21].includes(day);
              const isSelected = day === 11;
              const cellOpacity = interpolate(frame, [i * 2 + 5, i * 2 + 15], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={day}
                  style={{
                    opacity: cellOpacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    color: isSelected ? '#fff' : C.sub,
                    background: isSelected ? C.indigo : 'transparent',
                    position: 'relative',
                  }}
                >
                  {day}
                  {hasData && !isSelected && (
                    <span style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: C.emerald,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.emerald, display: 'inline-block' }} /> Complete
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block' }} /> Partial
            </span>
          </div>
        </Card>

        {/* Entry form */}
        <Card
          style={{
            opacity: interpolate(formProgress, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(formProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Tuesday, March 11, 2026
          </div>
          <div style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>Enter your nutrition for this day</div>

          {/* Calories */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Energy</div>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#09090b', border: `1px solid ${C.indigo}50`,
              borderRadius: 12, padding: '12px 16px',
              opacity: calOpacity,
            }}>
              <span style={{ flex: 1, fontSize: 20, fontWeight: 700, color: C.text }}>2,150</span>
              <span style={{ fontSize: 13, color: C.dim }}>kcal</span>
            </div>
          </div>

          {/* Macros */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Macronutrients</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[['Protein', '165', 'g', C.blue], ['Carbohydrates', '245', 'g', C.amber], ['Fat', '72', 'g', C.rose]].map(([label, val, unit, color]) => (
                <div key={label as string} style={{
                  background: '#09090b', border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '10px 14px',
                  opacity: calOpacity,
                }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color }}>{val}</span>
                    <span style={{ fontSize: 13, color: C.dim }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Macro bar */}
            <div style={{ marginTop: 12, opacity: macroBarOpacity }}>
              <div style={{ display: 'flex', borderRadius: 999, overflow: 'hidden', height: 8, gap: 2 }}>
                <div style={{ width: `${pWidth}%`, background: C.blue }} />
                <div style={{ width: `${cWidth}%`, background: C.amber }} />
                <div style={{ width: `${fWidth}%`, background: C.rose }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: C.dim }}>
                <span style={{ color: C.blue }}>31% protein</span>
                <span style={{ color: C.amber }}>46% carbs</span>
                <span style={{ color: C.rose }}>23% fat</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SceneLabel text="Calendar date picker · Macro breakdown · 7-day rolling summary · Recovery insights" delay={120} />
    </AbsoluteFill>
  );
};

// ─── Scene 8: AI Coach ─────────────────────────────────────────────────────────

const RESPONSE = "Your legs are showing an ACWR of 1.71, which is above the 1.5 danger threshold. Consider reducing squat and leg press volume by 20–30% this week. Your chest and back are in the optimal 0.8–1.5 range — keep those sessions as-is.";

const CoachScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelProgress = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const userMsgOpacity = useFadeIn(20);
  const responseMsgOpacity = useFadeIn(45);

  const charsToShow = Math.floor(
    interpolate(frame, [50, 105], [0, RESPONSE.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    })
  );

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 80, fontFamily: 'system-ui, sans-serif' }}>
      <SectionTitle title="AI Coach" subtitle="Ask anything about your training — powered by Ollama" />

      <div style={{
        display: 'flex',
        gap: 24,
        transform: `translateX(${interpolate(panelProgress, [0, 1], [30, 0])}px)`,
        opacity: interpolate(panelProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Suggested questions */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Suggested questions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Am I overtraining any muscle groups?',
                'What should I focus on to break my biggest plateau?',
                'Plan me a deload week based on my recent training',
              ].map((q) => (
                <div key={q} style={{
                  background: '#09090b', border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '10px 14px', fontSize: 13, color: C.sub,
                }}>
                  {q}
                </div>
              ))}
            </div>
          </Card>

          {/* Messages */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: userMsgOpacity }}>
            <div style={{
              background: C.indigo, borderRadius: '18px 18px 4px 18px',
              padding: '12px 18px', fontSize: 14, color: '#fff', maxWidth: '70%',
            }}>
              Am I overtraining my legs?
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: responseMsgOpacity }}>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '18px 18px 18px 4px',
              padding: '14px 18px', fontSize: 14, color: C.sub, maxWidth: '80%', lineHeight: 1.6,
            }}>
              {RESPONSE.slice(0, charsToShow)}
              {charsToShow < RESPONSE.length && (
                <span style={{ display: 'inline-block', width: 2, height: 14, background: C.indigo, marginLeft: 2, verticalAlign: 'text-bottom' }} />
              )}
            </div>
          </div>
        </div>
      </div>

      <SceneLabel text="Streaming AI responses · Full workout context · Data-grounded coaching" delay={100} />
    </AbsoluteFill>
  );
};

// ─── Scene 9: Outro ────────────────────────────────────────────────────────────

const FEATURES = [
  '52-week consistency heatmap',
  'ACWR fatigue & recovery tracking',
  'Strength balance analysis',
  'Plateau detection',
  'Weekly volume trends',
  'Personal records tracker',
  'Session quality scoring',
  'Nutrition logging with macro breakdown',
  'AI coaching powered by Ollama',
];

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame: frame - 5, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <div style={{ transform: `scale(${titleScale})`, marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.text, letterSpacing: -1.5, marginBottom: 12 }}>
          Training Intelligence
        </div>
        <div style={{ fontSize: 20, color: C.dim }}>
          Everything you need to train smarter
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 960 }}>
        {FEATURES.map((feature, i) => {
          const { opacity, translateY } = useSlideUp(i * 6 + 20);
          return (
            <div
              key={feature}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 13,
                color: C.sub,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ color: C.indigo, fontSize: 16 }}>✓</span>
              {feature}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 48, opacity: useFadeIn(70), fontSize: 14, color: C.muted }}>
        Built with Next.js · Hevy API · Ollama · Recharts · Remotion
      </div>
    </AbsoluteFill>
  );
};

// ─── Main composition ──────────────────────────────────────────────────────────

export const Walkthrough: React.FC = () => {
  const T = TRANSITION_FRAMES;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.intro}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.stats}>
          <StatsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.heatmap}>
          <HeatmapScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.acwr}>
          <AcwrScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.volume}>
          <VolumeScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.quality}>
          <QualityScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.nutrition}>
          <NutritionScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.coach}>
          <CoachScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
