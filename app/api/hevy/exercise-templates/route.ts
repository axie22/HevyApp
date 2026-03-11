import { getCachedTemplates } from '@/lib/hevy';

export async function GET() {
  const templates = await getCachedTemplates();
  return Response.json(templates);
}
