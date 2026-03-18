import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#09090b',
  card: '#111113',
  cardUp: '#18181b',
  border: '#27272a',
  borderUp: '#3f3f46',
  muted: '#52525b',
  dim: '#71717a',
  sub: '#a1a1aa',
  text: '#f4f4f5',
  accent: '#6366f1',
  accentLight: '#818cf8',
  accentDim: 'rgba(99,102,241,0.12)',
  accentBorder: 'rgba(99,102,241,0.28)',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.1)',
  blue: '#60a5fa',
  rose: '#fb7185',
};

// Scene durations (frames @ 30fps)
const D = {
  intro:         90,
  nav:           75,
  commandCenter: 130,
  training:      160,
  recovery:      140,
  nutrition:     130,
  coach:         130,
  outro:         100,
};

const TRANSITION_FRAMES = 18;
const NUM_TRANSITIONS = Object.keys(D).length - 1; // 7

export const TOTAL_FRAMES =
  Object.values(D).reduce((s, v) => s + v, 0) -
  TRANSITION_FRAMES * NUM_TRANSITIONS;

// ─── Animation helpers ─────────────────────────────────────────────────────────

function useFadeIn(delay = 0, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function useSlideUp(delay = 0, duration = 30) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 180, stiffness: 120 } });
  return {
    opacity: interpolate(progress, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' }),
    translateY: interpolate(progress, [0, 1], [20, 0]),
  };
}

function useSpring(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 180, stiffness: 120 } });
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, ...style }}>
    {children}
  </div>
);

const MonoLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <div style={{
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color ?? C.muted,
    fontWeight: 600,
  }}>
    {children}
  </div>
);

const PageTitle: React.FC<{ title: string; sub: string; delay?: number }> = ({ title, sub, delay = 0 }) => {
  const { opacity, translateY } = useSlideUp(delay);
  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, marginBottom: 36 }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 6, fontFamily: 'system-ui, sans-serif' }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: C.dim, fontFamily: 'system-ui, sans-serif' }}>{sub}</div>
    </div>
  );
};

const SceneCaption: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const opacity = useFadeIn(delay);
  return (
    <div style={{
      position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center',
      opacity, color: C.muted, fontSize: 18, letterSpacing: 0.5,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {text}
    </div>
  );
};

// ─── Navbar mockup (reused across scenes) ──────────────────────────────────────

const MockNavbar: React.FC<{ activePage?: string; opacity?: number }> = ({ activePage = '/', opacity = 1 }) => {
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/training', label: 'Training' },
    { href: '/recovery', label: 'Recovery' },
    { href: '/nutrition', label: 'Nutrition' },
    { href: '/coach', label: 'Coach' },
    { href: '/profile', label: 'Profile' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 48,
      background: 'rgba(8,8,8,0.92)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 80,
      paddingRight: 80,
      justifyContent: 'space-between',
      opacity,
      zIndex: 10,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, background: C.accent, borderRadius: 3 }} />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.1em', color: C.sub, fontWeight: 600 }}>
          GAUGE
        </span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {links.map(({ href, label }) => {
          const active = activePage === href;
          return (
            <div key={href} style={{
              padding: '5px 12px',
              borderRadius: 6,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.06em',
              fontWeight: 500,
              color: active ? C.accent : C.sub,
              background: active ? C.accentDim : 'transparent',
              border: active ? `1px solid ${C.accentBorder}` : '1px solid transparent',
            }}>
              {label.toUpperCase()}
            </div>
          );
        })}

        <div style={{ width: 1, height: 14, background: C.border, margin: '0 8px' }} />

        <div style={{
          padding: '5px 10px',
          borderRadius: 6,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.08em',
          fontWeight: 600,
          color: C.text,
          border: `1px solid ${C.borderUp}`,
          background: '#18181b',
        }}>
          KG
        </div>
      </div>
    </div>
  );
};

// ─── Scene 1: Intro ────────────────────────────────────────────────────────────

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [12, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [30, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagsOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)',
      }} />

      {/* Logo mark */}
      <div style={{
        transform: `scale(${logoScale})`,
        marginBottom: 36,
        width: 88,
        height: 88,
        borderRadius: 24,
        background: C.accentDim,
        border: `1px solid ${C.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Gauge / speedometer icon */}
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
          <path d="M12 12l3.5-3.5" />
          <circle cx="12" cy="12" r="1.5" fill={C.accent} stroke="none" />
          <path d="M16.5 19.5a7 7 0 0 0 2-4.5" />
        </svg>
      </div>

      {/* App name */}
      <div style={{
        opacity: titleOpacity,
        fontSize: 80,
        fontWeight: 800,
        color: C.text,
        letterSpacing: -3,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        Gauge
      </div>

      {/* Tagline */}
      <div style={{
        opacity: subtitleOpacity,
        fontSize: 26,
        color: C.dim,
        marginBottom: 52,
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 1.4,
      }}>
        Training analytics · Recovery tracking · AI coaching
      </div>

      {/* Tech badges */}
      <div style={{ opacity: tagsOpacity, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Next.js 16', 'Hevy API', 'Whoop', 'Ollama AI', 'Recharts'].map((badge) => (
          <div key={badge} style={{
            padding: '7px 16px',
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: C.card,
            color: C.sub,
            fontSize: 13,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.04em',
          }}>
            {badge}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Navigation ───────────────────────────────────────────────────────

const NavScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pages = [
    { href: '/', label: 'Dashboard', desc: 'Command center — key vitals at a glance', icon: '⊞' },
    { href: '/training', label: 'Training', desc: 'All analytics: volume, 1RM, plateaus, session quality', icon: '⟆' },
    { href: '/recovery', label: 'Recovery', desc: 'Whoop biometrics, muscle readiness, balance', icon: '♡' },
    { href: '/nutrition', label: 'Nutrition', desc: 'Calories, macros, 7-day calendar log', icon: '◎' },
    { href: '/coach', label: 'Coach', desc: 'Full-page AI coaching with full training context', icon: '◈' },
    { href: '/profile', label: 'Profile', desc: 'Body metrics, goals, Whoop connection', icon: '◉' },
  ];

  const navProgress = useSpring(5);

  return (
    <AbsoluteFill style={{ background: C.bg, padding: '80px 80px 80px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <div style={{
        transform: `translateY(${interpolate(navProgress, [0, 1], [-48, 0])}px)`,
        opacity: interpolate(navProgress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
        marginBottom: 48,
      }}>
        <MockNavbar activePage="/training" opacity={1} />
      </div>

      <PageTitle title="Six focused destinations" sub="Each page serves one purpose — no more scrolling through everything" delay={8} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 8 }}>
        {pages.map(({ href, label, desc, icon }, i) => {
          const { opacity, translateY } = useSlideUp(i * 8 + 16);
          const isActive = href === '/training';
          return (
            <div key={href} style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              background: isActive ? C.accentDim : C.card,
              border: `1px solid ${isActive ? C.accentBorder : C.border}`,
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: isActive ? C.accent : C.dim }}>{icon}</span>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  color: isActive ? C.accent : C.sub,
                }}>
                  {label.toUpperCase()}
                </span>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  color: C.muted,
                  marginLeft: 'auto',
                }}>
                  {href}
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{desc}</div>
            </div>
          );
        })}
      </div>

      <SceneCaption text="Intentional navigation — each destination has full context and dedicated analytics" delay={55} />
    </AbsoluteFill>
  );
};

// ─── Scene 3: Command Center (home) ───────────────────────────────────────────

// Deterministic heatmap
function makeHeatmap(cols: number, rows: number) {
  return Array.from({ length: cols * rows }, (_, i) => {
    const v = ((i * 1664525 + 1013904223) >>> 0) % 256;
    return v / 255;
  });
}

const CommandCenterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cols = 32;
  const rows = 7;
  const cells = makeHeatmap(cols, rows);

  const statsProgress = useSpring(12);
  const leftColProgress = useSpring(28);

  const stats = [
    { label: 'Sessions', value: '4', sub: 'this week' },
    { label: 'Volume', value: '8.2k', sub: 'kg this month' },
    { label: 'Streak', value: '7', sub: 'days active', accent: true },
    { label: 'All-time', value: '127', sub: 'workouts' },
    { label: 'Balance', value: '84%', sub: '12-wk coverage' },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <MockNavbar activePage="/" />

      <div style={{ padding: '64px 80px 80px', paddingTop: 64 }}>
        {/* Page header */}
        <div style={{ ...useSlideUp(5), marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Gauge</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em', marginTop: 4 }}>
                127 workouts analyzed · last session 2026-03-15
              </div>
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em' }}>
              WED, MAR 18, 2026
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderBottom: `1px solid ${C.border}`,
          opacity: interpolate(statsProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(statsProgress, [0, 1], [16, 0])}px)`,
        }}>
          {stats.map(({ label, value, sub, accent }, i) => (
            <div key={label} style={{
              padding: '20px 24px',
              borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.12em', marginBottom: 8 }}>
                {label.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 40, fontWeight: 700, color: accent ? C.accent : C.text, letterSpacing: -1, lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.06em', marginTop: 6 }}>
                {sub.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 24 }}>
          {/* Left: signal cards */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            opacity: interpolate(leftColProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(leftColProgress, [0, 1], [20, 0])}px)`,
          }}>
            {/* Recovery signal */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <MonoLabel>Recovery · Whoop</MonoLabel>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.accent }}>VIEW →</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 30, fontWeight: 700, color: C.green, letterSpacing: -1, lineHeight: 1 }}>
                    76<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>%</span>
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.green, letterSpacing: '0.1em', marginTop: 3 }}>RECOVERED</div>
                </div>
                <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, paddingLeft: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['HRV', '62 ms'], ['RHR', '51 bpm']].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plateau signal */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <MonoLabel>Plateaus</MonoLabel>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.accent }}>VIEW →</span>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 28, fontWeight: 700, color: C.amber, letterSpacing: -1, lineHeight: 1 }}>
                2 <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>alerts</span>
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.04em', marginTop: 4 }}>
                Bench Press · 4wk stall
              </div>
            </div>

            {/* Nutrition strip */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <MonoLabel>Nutrition · 7d avg</MonoLabel>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.accent }}>LOG →</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {[['Calories', '2,140', 'kcal', C.text], ['Protein', '158', 'g', C.accent]].map(([l, v, u, col]) => (
                  <div key={l as string}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 700, color: col as string, letterSpacing: -0.5, lineHeight: 1 }}>
                      {v}<span style={{ fontSize: 9, fontWeight: 400, color: C.muted, marginLeft: 3 }}>{u}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: heatmap */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.12em', marginBottom: 12 }}>
              52-WEEK CONSISTENCY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2.5 }}>
              {cells.map((val, i) => {
                const col = Math.floor(i / rows);
                const appears = col * 1.5;
                const opacity = interpolate(frame, [appears + 32, appears + 42], [0, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                });
                const level = val < 0.45 ? 0 : val < 0.6 ? 1 : val < 0.75 ? 2 : val < 0.88 ? 3 : 4;
                const bgColors = ['#27272a', '#14532d', '#166534', '#15803d', '#22c55e'];
                return (
                  <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 2, background: bgColors[level], opacity }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
              {[['Current streak', '7 days', C.green], ['Longest', '23 days', C.text], ['Avg gap', '1.4 days', C.text]].map(([l, v, c]) => (
                <div key={l as string} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted }}>
                  {l}: <span style={{ color: c as string, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SceneCaption text="Command center — vitals bar + signal cards + 52-week consistency heatmap" delay={100} />
    </AbsoluteFill>
  );
};

// ─── Scene 4: Training page ────────────────────────────────────────────────────

const WEEKLY_VOL = [2100, 3400, 1800, 4200, 3900, 2600, 5100, 4700, 3200, 5800, 4900, 6200, 5400, 7100, 6800, 0];
const maxVol = Math.max(...WEEKLY_VOL.filter(Boolean));

const PLATEAUS = [
  { name: 'Bench Press', weeks: 4, risk: 'high' as const },
  { name: 'Overhead Press', weeks: 3, risk: 'medium' as const },
];

const QUALITY_SCORES = [6.8, 7.2, 5.9, 8.1, 7.5, 6.3, 8.4, 7.8, 6.5, 8.7, 7.1, 8.2, 7.9, 8.5, 7.3, 8.8, 7.6, 9.0];

const TrainingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = useSpring(5);
  const volProgress = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 50 });

  const W = 580; const H = 150; const padX = 10; const padY = 10;
  const qualPoints = QUALITY_SCORES.map((s, i) => ({
    x: padX + (i / (QUALITY_SCORES.length - 1)) * (W - padX * 2),
    y: padY + (1 - (s - 4) / 6) * (H - padY * 2),
    s,
  }));
  const visQ = Math.floor(interpolate(spring({ frame: frame - 60, fps, config: { damping: 200 }, durationInFrames: 60 }), [0, 1], [0, qualPoints.length]));
  const qPath = qualPoints.slice(0, visQ + 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  function qColor(s: number) { return s >= 7.5 ? C.green : s >= 5 ? C.amber : C.red; }

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <MockNavbar activePage="/training" />

      <div style={{ padding: '64px 80px 50px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 28,
          opacity: interpolate(headerProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(headerProgress, [0, 1], [16, 0])}px)`,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Training</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em', marginTop: 3 }}>
              127 workouts · analytics &amp; progression
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Volume chart */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
              opacity: interpolate(volProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Weekly Volume</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 14 }}>LAST 16 WEEKS</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                {WEEKLY_VOL.map((vol, i) => {
                  const p = spring({ frame: frame - i * 2 - 18, fps, config: { damping: 200 } });
                  const h = interpolate(p, [0, 1], [0, vol === 0 ? 3 : (vol / maxVol) * 100]);
                  const isCur = i === WEEKLY_VOL.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, height: h, borderRadius: '2px 2px 0 0', alignSelf: 'flex-end', background: isCur ? C.accent : C.green, opacity: vol === 0 ? 0.15 : isCur ? 0.9 : 0.55 }} />
                  );
                })}
              </div>
            </div>

            {/* Session quality chart */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
              ...(() => { const { opacity, translateY } = useSlideUp(55); return { opacity, transform: `translateY(${translateY}px)` }; })(),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Session Quality</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>DENSITY · COMPLETENESS · TIMING</div>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 24, fontWeight: 700, color: C.green, letterSpacing: -0.5, lineHeight: 1 }}>
                  7.8<span style={{ fontSize: 10, fontWeight: 400, color: C.muted, marginLeft: 2 }}>/10 avg</span>
                </div>
              </div>
              <svg width="100%" viewBox={`0 0 ${W} ${H + padY * 2}`} style={{ display: 'block' }}>
                {[5, 7.5].map((y) => {
                  const cy = padY + (1 - (y - 4) / 6) * (H - padY * 2);
                  return <line key={y} x1={padX} x2={W - padX} y1={cy} y2={cy} stroke={y === 7.5 ? C.green : C.amber} strokeDasharray="4 3" strokeOpacity={0.25} strokeWidth={1} />;
                })}
                {qPath && <path d={qPath} fill="none" stroke={C.accent} strokeWidth={2} />}
                {qualPoints.slice(0, visQ + 1).map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={4} fill={qColor(p.s)} stroke={C.bg} strokeWidth={1.5} />
                ))}
              </svg>
            </div>
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Plateaus */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px',
              ...(() => { const { opacity, translateY } = useSlideUp(30); return { opacity, transform: `translateY(${translateY}px)` }; })(),
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Plateau Detection</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 14 }}>STALLED EXERCISES</div>
              {PLATEAUS.map(({ name, weeks, risk }, i) => {
                const { opacity, translateY } = useSlideUp(32 + i * 10);
                const col = risk === 'high' ? C.red : C.amber;
                return (
                  <div key={name} style={{
                    opacity, transform: `translateY(${translateY}px)`,
                    background: '#0d0d0f', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.sub }}>{name}</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, padding: '2px 7px', borderRadius: 4, background: `${col}18`, color: col, border: `1px solid ${col}30` }}>
                        {risk.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, marginTop: 5, letterSpacing: '0.04em' }}>
                      {weeks} weeks stalled
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PRs */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px',
              ...(() => { const { opacity, translateY } = useSlideUp(50); return { opacity, transform: `translateY(${translateY}px)` }; })(),
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Personal Records</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 12 }}>BEST WEIGHT PER LIFT</div>
              {[['Deadlift', '182.5 kg'], ['Back Squat', '142.5 kg'], ['Bench Press', '102.5 kg']].map(([ex, kg], i) => {
                const { opacity, translateY } = useSlideUp(52 + i * 8);
                return (
                  <div key={ex as string} style={{
                    opacity, transform: `translateY(${translateY}px)`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{ex}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: C.text }}>{kg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <SceneCaption text="/training — volume trends · 1RM progression · plateau detection · session quality" delay={130} />
    </AbsoluteFill>
  );
};

// ─── Scene 5: Recovery page ────────────────────────────────────────────────────

const RECOVERY_TREND = [71, 58, 82, 65, 79, 43, 76];
const SLEEP_STAGES = [
  { label: 'Deep', pct: 0.22, color: '#6366f1' },
  { label: 'REM', pct: 0.19, color: '#818cf8' },
  { label: 'Light', pct: 0.47, color: '#3f3f46' },
  { label: 'Awake', pct: 0.12, color: '#52525b' },
];

const MUSCLE_READINESS = [
  { group: 'Chest', readiness: 82, status: 'fresh' as const },
  { group: 'Back', readiness: 74, status: 'fresh' as const },
  { group: 'Quads', readiness: 38, status: 'fatigued' as const },
  { group: 'Shoulders', readiness: 66, status: 'fresh' as const },
  { group: 'Hamstrings', readiness: 29, status: 'overtrained' as const },
];

function readinessColor(s: 'fresh' | 'fatigued' | 'overtrained') {
  return s === 'fresh' ? C.green : s === 'fatigued' ? C.amber : C.red;
}

const RecoveryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = useSpring(5);
  const whoopProgress = useSpring(18);
  const readinessProgress = useSpring(30);
  const sleepProgress = useSpring(45);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <MockNavbar activePage="/recovery" />

      <div style={{ padding: '64px 80px 50px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 28,
          opacity: interpolate(headerProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(headerProgress, [0, 1], [16, 0])}px)`,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Recovery</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em', marginTop: 3 }}>
              muscle readiness · biometrics · balance
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Whoop recovery card */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            opacity: interpolate(whoopProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(whoopProgress, [0, 1], [20, 0])}px)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Recovery</div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.1em' }}>POWERED BY WHOOP</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 42, fontWeight: 700, color: C.green, letterSpacing: -1.5, lineHeight: 1 }}>
                  76<span style={{ fontSize: 18, fontWeight: 400, color: C.muted }}>%</span>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.green, letterSpacing: '0.1em', marginTop: 3 }}>RECOVERED</div>
              </div>
            </div>
            {/* HRV + RHR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              {[['HRV', '62', 'ms'], ['RHR', '51', 'bpm'], ['7D AVG HRV', '58', 'ms']].map(([l, v, u]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, letterSpacing: '0.1em', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, fontWeight: 700, color: C.text }}>{v}<span style={{ fontSize: 9, fontWeight: 400, color: C.muted, marginLeft: 2 }}>{u}</span></div>
                </div>
              ))}
            </div>
            {/* 7-day trend dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, letterSpacing: '0.08em', marginRight: 4 }}>7D</span>
              {RECOVERY_TREND.map((s, i) => {
                const dotOpacity = interpolate(frame, [i * 4 + 22, i * 4 + 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const col = s >= 67 ? C.green : s >= 34 ? C.amber : C.red;
                return <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: col, opacity: dotOpacity * (0.5 + i / RECOVERY_TREND.length * 0.5) }} />;
              })}
            </div>
          </div>

          {/* Muscle Readiness */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            opacity: interpolate(readinessProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(readinessProgress, [0, 1], [20, 0])}px)`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Muscle Readiness</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 14 }}>BASED ON RECENT TRAINING LOAD</div>
            {MUSCLE_READINESS.map(({ group, readiness, status }, i) => {
              const p = spring({ frame: frame - i * 6 - 32, fps, config: { damping: 200 } });
              const barW = interpolate(p, [0, 1], [0, readiness]);
              const col = readinessColor(status);
              const rowOpacity = interpolate(frame, [i * 6 + 32, i * 6 + 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              return (
                <div key={group} style={{ marginBottom: 10, opacity: rowOpacity }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{group}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: col, fontWeight: 600 }}>{readiness}</span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${barW}%`, background: col, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sleep breakdown */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            opacity: interpolate(sleepProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(sleepProgress, [0, 1], [20, 0])}px)`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Sleep Breakdown</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 16 }}>LAST NIGHT · 7h 22m total</div>
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 10, gap: 2, marginBottom: 14 }}>
              {SLEEP_STAGES.map(({ label, pct, color }, i) => {
                const sp = spring({ frame: frame - i * 4 - 48, fps, config: { damping: 200 } });
                return <div key={label} style={{ width: `${interpolate(sp, [0, 1], [0, pct * 100])}%`, background: color, borderRadius: 3 }} />;
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SLEEP_STAGES.map(({ label, pct, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.text, marginLeft: 'auto', fontWeight: 600 }}>{Math.round(pct * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* HRV trend mini chart */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            ...(() => { const { opacity, translateY } = useSlideUp(62); return { opacity, transform: `translateY(${translateY}px)` }; })(),
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>HRV Trend</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 12 }}>30-DAY ROLLING</div>
            {/* Simple bar chart of daily HRV */}
            {(() => {
              const HRV = [55, 60, 52, 68, 71, 59, 62, 66, 58, 72, 61, 63, 67, 70, 58, 65, 73, 69, 62, 76, 61, 58, 64, 70, 68, 71, 62, 59, 62, 67];
              const maxH = Math.max(...HRV);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
                  {HRV.map((v, i) => {
                    const p = spring({ frame: frame - i * 1.5 - 65, fps, config: { damping: 200 } });
                    const h = interpolate(p, [0, 1], [0, (v / maxH) * 80]);
                    return <div key={i} style={{ flex: 1, height: h, borderRadius: '2px 2px 0 0', alignSelf: 'flex-end', background: C.accentLight, opacity: 0.5 + (i / HRV.length) * 0.5 }} />;
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <SceneCaption text="/recovery — Whoop biometrics · muscle readiness · sleep stages · HRV trend" delay={110} />
    </AbsoluteFill>
  );
};

// ─── Scene 6: Nutrition ────────────────────────────────────────────────────────

const NutritionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = useSpring(5);
  const calProgress = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const macroProgress = spring({ frame: frame - 45, fps, config: { damping: 200 } });

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEK_DATA = [
    { cal: 2100, pro: 155 },
    { cal: 1950, pro: 148 },
    { cal: 2300, pro: 168 },
    { cal: 2150, pro: 160 },
    { cal: 0, pro: 0 },      // not logged
    { cal: 2400, pro: 172 },
    { cal: 2050, pro: 152 },
  ];

  const MACROS = [
    { label: 'Protein', val: 160, unit: 'g', pct: 0.30, color: C.blue },
    { label: 'Carbs', val: 248, unit: 'g', pct: 0.47, color: C.amber },
    { label: 'Fat', val: 72, unit: 'g', pct: 0.23, color: C.rose },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <MockNavbar activePage="/nutrition" />

      <div style={{ padding: '64px 80px 50px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 28,
          opacity: interpolate(headerProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(headerProgress, [0, 1], [16, 0])}px)`,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Nutrition</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em', marginTop: 3 }}>
              Track calories, macros &amp; hydration
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* 7-day chips */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>This Week</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 16 }}>6/7 TRACKED</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAYS.map((day, i) => {
                const d = WEEK_DATA[i];
                const hasData = d.cal > 0;
                const chipOpacity = interpolate(frame, [i * 4 + 18, i * 4 + 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return (
                  <div key={day} style={{
                    opacity: chipOpacity,
                    padding: '10px 6px',
                    borderRadius: 10,
                    textAlign: 'center',
                    border: `1px solid ${hasData ? C.borderUp : C.border}`,
                    background: hasData ? '#1a1a1e' : 'transparent',
                  }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.06em', marginBottom: 7 }}>{day.toUpperCase()}</div>
                    {hasData ? (
                      <>
                        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{Math.round(d.cal / 100) / 10}k</div>
                        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, marginTop: 1 }}>KCAL</div>
                        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: C.accent, marginTop: 5 }}>{d.pro}g</div>
                        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted }}>PRO</div>
                      </>
                    ) : (
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: C.muted, marginTop: 4 }}>—</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Averages row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
              {[['AVG CAL', '2,158', 'kcal'], ['AVG PROTEIN', '159', 'g'], ['AVG CARBS', '247', 'g'], ['AVG FAT', '71', 'g']].map(([l, v, u]) => {
                const { opacity, translateY } = useSlideUp(55);
                return (
                  <div key={l as string} style={{ opacity, transform: `translateY(${translateY}px)`, background: '#0d0d0f', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, color: C.muted, letterSpacing: '0.08em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, color: C.text }}>
                      {v} <span style={{ fontSize: 9, fontWeight: 400, color: C.muted }}>{u}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Macro breakdown */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            opacity: interpolate(calProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(calProgress, [0, 1], [20, 0])}px)`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Today</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 16 }}>MAR 18, 2026</div>

            {/* Calories */}
            <div style={{ background: '#0d0d0f', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginBottom: 6 }}>CALORIES</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -1, lineHeight: 1 }}>
                {Math.round(interpolate(macroProgress, [0, 1], [0, 2150]))}
                <span style={{ fontSize: 12, fontWeight: 400, color: C.muted, marginLeft: 6 }}>kcal</span>
              </div>
            </div>

            {/* Macro bars */}
            {MACROS.map(({ label, val, unit, pct, color }) => {
              const p = interpolate(macroProgress, [0, 1], [0, pct * 100]);
              const { opacity, translateY } = useSlideUp(48);
              return (
                <div key={label} style={{ opacity, transform: `translateY(${translateY}px)`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 700, color }}>{val}{unit}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SceneCaption text="/nutrition — 7-day calendar · macro tracking · averages · recovery insights" delay={100} />
    </AbsoluteFill>
  );
};

// ─── Scene 7: Coach (full-page) ────────────────────────────────────────────────

const COACH_RESPONSE = "Your legs are showing an ACWR of 1.71 — above the danger threshold. I'd recommend cutting squat and leg press volume by 20–30% this week. Your bench plateau (4 weeks) likely needs a technique or rep-range variation, not more weight. HRV trending up over 7 days suggests your body is recovering well overall.";

const CoachScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelProgress = useSpring(8);
  const userMsgOpacity = useFadeIn(22);
  const assistantOpacity = useFadeIn(44);

  const charsToShow = Math.floor(interpolate(frame, [50, 120], [0, COACH_RESPONSE.length], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  }));

  const questions = [
    'Am I overtraining any muscle groups?',
    'What should I focus on to break my biggest plateau?',
    'Should I train hard today based on my recovery score?',
    'Plan me a deload week based on my recent training',
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <MockNavbar activePage="/coach" />

      <div style={{ padding: '64px 80px 50px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 24,
          opacity: interpolate(panelProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(panelProgress, [0, 1], [16, 0])}px)`,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Coach</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted, letterSpacing: '0.04em', marginTop: 3 }}>
              AI coaching · powered by Ollama
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, flex: 1 }}>
          {/* Suggested questions */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            opacity: interpolate(panelProgress, [0.3, 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.12em', marginBottom: 14 }}>
              SUGGESTED QUESTIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {questions.map((q, i) => {
                const { opacity, translateY } = useSlideUp(12 + i * 8);
                return (
                  <div key={q} style={{
                    opacity, transform: `translateY(${translateY}px)`,
                    background: '#0d0d0f', border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 12, color: C.sub, lineHeight: 1.4,
                  }}>
                    {q}
                  </div>
                );
              })}
            </div>

            {/* Context badge */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginBottom: 10 }}>CONTEXT LOADED</div>
              {['127 workouts', 'Whoop biometrics', 'Nutrition log', 'Profile'].map((item, i) => {
                const { opacity, translateY } = useSlideUp(32 + i * 6);
                return (
                  <div key={item} style={{ opacity, transform: `translateY(${translateY}px)`, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.dim }}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px',
            display: 'flex', flexDirection: 'column',
            opacity: interpolate(panelProgress, [0.2, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            {/* Messages */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: userMsgOpacity }}>
                <div style={{
                  background: C.accent, borderRadius: '18px 18px 4px 18px',
                  padding: '11px 16px', fontSize: 14, color: '#fff', maxWidth: '65%', lineHeight: 1.4,
                }}>
                  What&apos;s limiting my progress right now?
                </div>
              </div>

              {/* Assistant message (streaming) */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: assistantOpacity }}>
                <div style={{
                  background: '#0d0d0f', border: `1px solid ${C.border}`,
                  borderRadius: '18px 18px 18px 4px', padding: '12px 16px',
                  fontSize: 13, color: C.sub, maxWidth: '85%', lineHeight: 1.65,
                }}>
                  {COACH_RESPONSE.slice(0, charsToShow)}
                  {charsToShow < COACH_RESPONSE.length && (
                    <span style={{ display: 'inline-block', width: 2, height: 13, background: C.accent, marginLeft: 2, verticalAlign: 'text-bottom' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{
                flex: 1, background: '#0d0d0f', border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '10px 14px', fontSize: 13, color: C.muted,
              }}>
                Ask your coach…
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: C.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width={14} height={14} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SceneCaption text="/coach — full-page AI chat · streaming responses · complete training context" delay={105} />
    </AbsoluteFill>
  );
};

// ─── Scene 8: Outro ────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '⊞', text: 'Command center dashboard' },
  { icon: '◈', text: '52-week consistency heatmap' },
  { icon: '⟆', text: 'Volume trends & personal records' },
  { icon: '⟆', text: '1RM progression & overload suggestions' },
  { icon: '⟆', text: 'Plateau detection & alerts' },
  { icon: '⟆', text: 'Session quality scoring' },
  { icon: '♡', text: 'Whoop recovery & HRV tracking' },
  { icon: '♡', text: 'Muscle readiness & sleep breakdown' },
  { icon: '◎', text: 'Nutrition log with macro breakdown' },
  { icon: '◈', text: 'Full-page AI coaching (Ollama)' },
  { icon: '◉', text: 'Body metrics & goal tracking' },
  { icon: '∞', text: 'KG / LB unit toggle' },
];

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{
      background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 120px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      {/* Logo + title */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 44, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ width: 14, height: 14, background: C.accent, borderRadius: 4 }} />
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: C.sub, letterSpacing: '0.1em', fontWeight: 600 }}>GAUGE</div>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.text, letterSpacing: -1.5, marginBottom: 10 }}>
          Train smarter.
        </div>
        <div style={{ fontSize: 18, color: C.dim }}>
          Every feature you need to understand and improve your training.
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: '100%', maxWidth: 1100 }}>
        {FEATURES.map((f, i) => {
          const { opacity, translateY } = useSlideUp(i * 4 + 20);
          return (
            <div key={f.text} style={{
              opacity, transform: `translateY(${translateY}px)`,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: C.accent, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: C.sub }}>{f.text}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, opacity: useFadeIn(75), fontSize: 12, color: C.muted, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}>
        BUILT WITH NEXT.JS 16 · HEVY API · WHOOP · OLLAMA · RECHARTS · REMOTION
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
        <TransitionSeries.Sequence durationInFrames={D.nav}>
          <NavScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.commandCenter}>
          <CommandCenterScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.training}>
          <TrainingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={D.recovery}>
          <RecoveryScene />
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
