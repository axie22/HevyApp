import fs from 'fs/promises';
import path from 'path';
import type { UserProfile } from './profile';

const DATA_PATH = path.join(process.cwd(), 'data', 'profile.json');

export async function readProfileServer(): Promise<UserProfile> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as UserProfile;
  } catch {
    return {};
  }
}

function bmi(weightKg: number, heightCm: number): number {
  const hm = heightCm / 100;
  return weightKg / (hm * hm);
}

export function summarizeProfile(profile: UserProfile): string | null {
  const lines: string[] = [];

  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.age) lines.push(`Age: ${profile.age}`);
  if (profile.sex) lines.push(`Sex: ${profile.sex}`);
  if (profile.height_cm) lines.push(`Height: ${profile.height_cm} cm`);
  if (profile.weight_kg) {
    lines.push(`Current weight: ${profile.weight_kg} kg`);
    if (profile.height_cm) {
      const b = bmi(profile.weight_kg, profile.height_cm);
      lines.push(`BMI: ${b.toFixed(1)}`);
    }
  }
  if (profile.goal_weight_kg) {
    lines.push(`Goal weight: ${profile.goal_weight_kg} kg`);
    if (profile.weight_kg) {
      const diff = profile.goal_weight_kg - profile.weight_kg;
      lines.push(`Remaining to goal: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`);
    }
  }
  if (profile.training_goal) {
    lines.push(`Primary training goal: ${profile.training_goal.replace(/_/g, ' ')}`);
  }
  if (profile.experience_level) {
    lines.push(`Training experience: ${profile.experience_level}`);
  }
  if (profile.notes?.trim()) {
    lines.push(`Additional context: ${profile.notes.trim()}`);
  }

  if (lines.length === 0) return null;
  return lines.join('\n');
}
