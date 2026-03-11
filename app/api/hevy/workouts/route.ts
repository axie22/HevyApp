import { getCachedWorkouts, getCachedTemplates, buildTemplateMap, enrichWorkouts } from '@/lib/hevy';

export async function GET() {
  const [workouts, templates] = await Promise.all([
    getCachedWorkouts(),
    getCachedTemplates(),
  ]);
  const templateMap = buildTemplateMap(templates);
  const enriched = enrichWorkouts(workouts, templateMap);
  return Response.json(enriched);
}
