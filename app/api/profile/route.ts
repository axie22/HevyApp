import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { UserProfile } from '@/lib/profile';

const DATA_PATH = path.join(process.cwd(), 'data', 'profile.json');

async function readProfile(): Promise<UserProfile> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as UserProfile;
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json(await readProfile());
}

export async function POST(req: NextRequest) {
  const profile: UserProfile = await req.json();
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(profile, null, 2), 'utf-8');
  return NextResponse.json({ ok: true });
}
