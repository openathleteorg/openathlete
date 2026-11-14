import client, { routes } from '@/utils/axios';

import {
  AppliedTrainingPlan,
  ApplyTrainingPlanDto,
  CreateTrainingPlanFromCalendarDto,
  ImportTrainingPlanDto,
  TrainingPlanApplyPreview,
  TrainingPlanApplyResponse,
  TrainingPlanFile,
  TrainingPlanRemoveResult,
  TrainingPlanTemplateDetail,
  TrainingPlanTemplateSummary,
  UpdateTrainingPlanTemplateDto,
} from '@openathlete/shared';

/** What the forms send: the defaults are filled in by the API */
export type ApplyTrainingPlanBody = Pick<ApplyTrainingPlanDto, 'targets'> &
  Partial<Omit<ApplyTrainingPlanDto, 'targets'>>;

export class TrainingPlanAPI {
  static async listTemplates(): Promise<TrainingPlanTemplateSummary[]> {
    const res = await client.get(routes.trainingPlan.templates);
    return res.data;
  }

  static async getTemplate(
    templateId: number,
  ): Promise<TrainingPlanTemplateDetail> {
    const res = await client.get(routes.trainingPlan.template(templateId));
    return res.data;
  }

  static async updateTemplate({
    templateId,
    body,
  }: {
    templateId: number;
    body: UpdateTrainingPlanTemplateDto;
  }): Promise<TrainingPlanTemplateSummary> {
    const res = await client.patch(
      routes.trainingPlan.template(templateId),
      body,
    );
    return res.data;
  }

  static async deleteTemplate(templateId: number): Promise<void> {
    await client.delete(routes.trainingPlan.template(templateId));
  }

  static async createFromCalendar(
    body: Omit<CreateTrainingPlanFromCalendarDto, 'weekStartsOn'>,
  ): Promise<TrainingPlanTemplateSummary> {
    const res = await client.post(routes.trainingPlan.fromCalendar, body);
    return res.data;
  }

  static async importTemplate(
    body: ImportTrainingPlanDto,
  ): Promise<TrainingPlanTemplateSummary> {
    const res = await client.post(routes.trainingPlan.import, body);
    return res.data;
  }

  static async exportTemplate(templateId: number): Promise<TrainingPlanFile> {
    const res = await client.get(routes.trainingPlan.export(templateId));
    return res.data;
  }

  static async previewApply({
    templateId,
    body,
  }: {
    templateId: number;
    body: ApplyTrainingPlanBody;
  }): Promise<TrainingPlanApplyPreview[]> {
    const res = await client.post(
      routes.trainingPlan.previewApply(templateId),
      body,
    );
    return res.data;
  }

  static async apply({
    templateId,
    body,
  }: {
    templateId: number;
    body: ApplyTrainingPlanBody;
  }): Promise<TrainingPlanApplyResponse> {
    const res = await client.post(routes.trainingPlan.apply(templateId), body);
    return res.data;
  }

  static async listApplied(
    includeArchived: boolean,
  ): Promise<AppliedTrainingPlan[]> {
    const res = await client.get(routes.trainingPlan.applied, {
      params: includeArchived ? { includeArchived: 'true' } : undefined,
    });
    return res.data;
  }

  static async shiftApplied({
    trainingPlanId,
    days,
  }: {
    trainingPlanId: number;
    days: number;
  }): Promise<{ trainingPlanId: number; moved: number }> {
    const res = await client.post(
      routes.trainingPlan.shiftApplied(trainingPlanId),
      { days },
    );
    return res.data;
  }

  static async removeApplied(
    trainingPlanId: number,
  ): Promise<TrainingPlanRemoveResult> {
    const res = await client.delete(
      routes.trainingPlan.appliedPlan(trainingPlanId),
    );
    return res.data;
  }
}
