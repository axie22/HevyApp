export interface UserProfile {
  name?: string | null;
  age?: number | null;
  sex?: 'male' | 'female' | 'other' | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal_weight_kg?: number | null;
  training_goal?: 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general_fitness' | null;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  notes?: string | null;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/profile');
  if (!res.ok) return {};
  return res.json();
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}
