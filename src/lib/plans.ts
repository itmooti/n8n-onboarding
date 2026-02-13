import type { TechLevel, WorkflowVolume, PlanKey } from '../types/onboarding';

export function recommendPlan(
  techLevel: TechLevel,
  workflowVolume: WorkflowVolume
): PlanKey {
  let rec: PlanKey = 'essentials';

  if (techLevel === 'full-service') {
    rec = 'pro';
  } else if (techLevel === 'some-help') {
    rec = 'support-plus';
  }

  if (workflowVolume === 'full-engine') {
    rec = techLevel === 'full-service' ? 'embedded' : 'pro';
  } else if (workflowVolume === 'growing' && rec === 'essentials') {
    rec = 'support-plus';
  } else if (workflowVolume === 'unsure' && rec === 'essentials') {
    rec = 'support-plus';
  }

  return rec;
}
