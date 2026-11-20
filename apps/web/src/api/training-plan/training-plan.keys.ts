export const trainingPlanKeys = {
  root: 'TrainingPlanAPI',
  templates: ['TrainingPlanAPI', 'templates'] as const,
  template: (templateId: number) =>
    ['TrainingPlanAPI', 'template', templateId] as const,
  applied: (includeArchived: boolean) =>
    ['TrainingPlanAPI', 'applied', includeArchived] as const,
} as const;
