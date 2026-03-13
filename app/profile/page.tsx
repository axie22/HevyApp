'use client';

import { useState, useEffect } from 'react';
import { fetchProfile, saveProfile, UserProfile } from '@/lib/profile';
import { useUnits } from '@/lib/units';

const TRAINING_GOALS = [
  { value: 'strength', label: 'Strength', desc: 'Maximize lifts (1RM focus)' },
  { value: 'hypertrophy', label: 'Hypertrophy', desc: 'Build muscle size' },
  { value: 'fat_loss', label: 'Fat Loss', desc: 'Reduce body fat' },
  { value: 'endurance', label: 'Endurance', desc: 'Improve stamina & conditioning' },
  { value: 'general_fitness', label: 'General Fitness', desc: 'Well-rounded health' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
] as const;

function parseNum(s: string): number | null {
  const v = parseFloat(s);
  return s.trim() !== '' && !isNaN(v) ? v : null;
}

// ─── Text input ────────────────────────────────────────────────────────────────

function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 transition-colors"
      />
    </div>
  );
}

// ─── Number input ──────────────────────────────────────────────────────────────

function NumInput({
  label,
  unit,
  value,
  onChange,
  placeholder = '—',
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 gap-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-600 transition-colors">
        <input
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none tabular-nums min-w-0"
        />
        <span className="text-xs text-zinc-500 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { unit, toDisplay, fmtWeight } = useUnits();
  const weightUnit = unit;
  const KG_PER_LB = 0.453592;

  // form state — all weights stored internally in kg
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [heightCm, setHeightCm] = useState('');
  const [weightDisplay, setWeightDisplay] = useState('');  // in user's unit
  const [goalWeightDisplay, setGoalWeightDisplay] = useState('');
  const [trainingGoal, setTrainingGoal] = useState<UserProfile['training_goal']>(null);
  const [experienceLevel, setExperienceLevel] = useState<UserProfile['experience_level']>(null);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Convert display value -> kg for storage
  function toKg(displayVal: string): number | null {
    const v = parseNum(displayVal);
    if (v === null) return null;
    return unit === 'lbs' ? v * KG_PER_LB : v;
  }

  // Convert kg -> display string
  function toDisplayStr(kg: number | null): string {
    if (kg === null) return '';
    const d = unit === 'lbs' ? kg / KG_PER_LB : kg;
    return d.toFixed(1);
  }

  useEffect(() => {
    fetchProfile().then((p) => {
      setName(p.name ?? '');
      setAge(p.age?.toString() ?? '');
      setSex(p.sex ?? '');
      setHeightCm(p.height_cm?.toString() ?? '');
      setWeightDisplay(toDisplayStr(p.weight_kg ?? null));
      setGoalWeightDisplay(toDisplayStr(p.goal_weight_kg ?? null));
      setTrainingGoal(p.training_goal ?? null);
      setExperienceLevel(p.experience_level ?? null);
      setNotes(p.notes ?? '');
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    const profile: UserProfile = {
      name: name.trim() || null,
      age: parseNum(age),
      sex: sex || null,
      height_cm: parseNum(heightCm),
      weight_kg: toKg(weightDisplay),
      goal_weight_kg: toKg(goalWeightDisplay),
      training_goal: trainingGoal,
      experience_level: experienceLevel,
      notes: notes.trim() || null,
    };
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // Derived display values for the summary card
  const currentWeightKg = toKg(weightDisplay);
  const goalWeightKg = toKg(goalWeightDisplay);
  const heightVal = parseNum(heightCm);
  const bmi =
    currentWeightKg && heightVal
      ? currentWeightKg / Math.pow(heightVal / 100, 2)
      : null;
  const weightDiff =
    currentWeightKg && goalWeightKg ? goalWeightKg - currentWeightKg : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Profile</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Personal information used to personalize your dashboard and AI coaching advice
          </p>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Form — 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <SectionLabel>Basic Information</SectionLabel>
                <div className="space-y-4">
                  <TextInput label="Name" value={name} onChange={setName} placeholder="Your name" />
                  <div className="grid grid-cols-2 gap-4">
                    <NumInput label="Age" unit="years" value={age} onChange={setAge} />
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sex</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as typeof sex)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 transition-colors"
                      >
                        <option value="">Not specified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Metrics */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <SectionLabel>Body Metrics</SectionLabel>
                <div className="grid grid-cols-3 gap-4">
                  <NumInput label="Height" unit="cm" value={heightCm} onChange={setHeightCm} />
                  <NumInput
                    label="Current Weight"
                    unit={weightUnit}
                    value={weightDisplay}
                    onChange={setWeightDisplay}
                  />
                  <NumInput
                    label="Goal Weight"
                    unit={weightUnit}
                    value={goalWeightDisplay}
                    onChange={setGoalWeightDisplay}
                  />
                </div>
                {bmi && (
                  <p className="mt-3 text-xs text-zinc-500">
                    BMI: <span className="text-zinc-300 font-medium">{bmi.toFixed(1)}</span>
                    {bmi < 18.5 && ' — Underweight'}
                    {bmi >= 18.5 && bmi < 25 && ' — Normal'}
                    {bmi >= 25 && bmi < 30 && ' — Overweight'}
                    {bmi >= 30 && ' — Obese'}
                  </p>
                )}
              </div>

              {/* Training Goal */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <SectionLabel>Training Goal</SectionLabel>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {TRAINING_GOALS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setTrainingGoal(trainingGoal === value ? null : value)}
                      className={`text-left rounded-xl border p-3.5 transition-all ${
                        trainingGoal === value
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/60'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${trainingGoal === value ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {label}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <SectionLabel>Experience Level</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {EXPERIENCE_LEVELS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setExperienceLevel(experienceLevel === value ? null : value)}
                      className={`text-left rounded-xl border p-3.5 transition-all ${
                        experienceLevel === value
                          ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/60'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${experienceLevel === value ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {label}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <SectionLabel>Additional Context</SectionLabel>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Notes for your AI coach
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any injuries, limitations, schedule constraints, or other context that would help personalize your coaching…"
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 resize-none transition-colors"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-3 transition-colors"
              >
                {saved ? 'Saved' : 'Save Profile'}
              </button>
            </div>

            {/* Summary card — 1/3 */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sticky top-22">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Profile Summary</h2>

                {/* Identity */}
                {(name || age || sex) && (
                  <div className="mb-4 pb-4 border-b border-zinc-800">
                    {name && <p className="text-base font-semibold text-zinc-100">{name}</p>}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {age && (
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                          {age} yrs
                        </span>
                      )}
                      {sex && (
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full capitalize">
                          {sex}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-3">
                  {heightVal && (
                    <Row label="Height" value={`${heightVal} cm`} />
                  )}
                  {currentWeightKg && (
                    <Row label="Current" value={fmtWeight(currentWeightKg)} />
                  )}
                  {goalWeightKg && (
                    <Row label="Goal" value={fmtWeight(goalWeightKg)} />
                  )}
                  {weightDiff !== null && (
                    <Row
                      label="To goal"
                      value={`${weightDiff > 0 ? '+' : ''}${toDisplay(Math.abs(weightDiff)).toFixed(1)} ${weightUnit}`}
                      accent={weightDiff < 0 ? 'emerald' : weightDiff > 0 ? 'amber' : 'zinc'}
                    />
                  )}
                  {bmi && (
                    <Row
                      label="BMI"
                      value={bmi.toFixed(1)}
                      accent={bmi < 18.5 || bmi >= 25 ? 'amber' : 'emerald'}
                    />
                  )}
                  {trainingGoal && (
                    <Row
                      label="Goal"
                      value={TRAINING_GOALS.find((g) => g.value === trainingGoal)?.label ?? ''}
                      accent="indigo"
                    />
                  )}
                  {experienceLevel && (
                    <Row
                      label="Level"
                      value={EXPERIENCE_LEVELS.find((l) => l.value === experienceLevel)?.label ?? ''}
                    />
                  )}
                </div>

                {/* Empty state */}
                {!name && !currentWeightKg && !trainingGoal && !experienceLevel && (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    Fill in your details to see a summary
                  </p>
                )}

                {/* AI coach note */}
                <div className="mt-6 rounded-xl bg-indigo-500/8 border border-indigo-500/15 p-3">
                  <p className="text-xs text-indigo-300 leading-relaxed">
                    Your profile is shared with the AI coach to provide personalized training and nutrition advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  accent = 'zinc',
}: {
  label: string;
  value: string;
  accent?: 'zinc' | 'emerald' | 'amber' | 'indigo';
}) {
  const valueClass = {
    zinc: 'text-zinc-200',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    indigo: 'text-indigo-300',
  }[accent];

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
