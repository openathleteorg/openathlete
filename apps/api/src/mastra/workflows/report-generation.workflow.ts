import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { synthesisAgent } from '../agents';

/**
 * Report Generation Workflow
 *
 * This workflow takes analyzed data and creates comprehensive reports.
 *
 * Steps:
 * 1. Structure the input data
 * 2. Generate comprehensive report with synthesis agent
 *
 * TODO: Add actual implementation once tools are available
 */

const synthesisStep = createStep({
  id: 'synthesize-report',
  description: 'Create a comprehensive report from analyzed data',
  inputSchema: z.object({
    data: z.string().describe('The data or findings to synthesize'),
    reportType: z.string().optional().describe('Type of report to generate'),
  }),
  outputSchema: z.object({
    report: z.string().describe('The generated comprehensive report'),
  }),
  execute: async ({ inputData }) => {
    // TODO: Implement actual synthesis logic with tools
    // For now, use the synthesis agent to generate report
    const response = await synthesisAgent.generate(
      `Create a comprehensive report based on: ${inputData.data}${inputData.reportType ? ` (Report type: ${inputData.reportType})` : ''}`,
      {
        structuredOutput: {
          schema: z.object({
            report: z.string(),
          }),
        },
      },
    );

    return { report: response.object.report };
  },
});

export const reportGenerationWorkflow = createWorkflow({
  id: 'report-generation',
  description:
    'Workflow for generating comprehensive reports from analyzed data. Use this when you need to create a final, well-structured report with full paragraphs.',
  steps: [],
  inputSchema: z.object({
    data: z.string().describe('Data to include in report'),
    reportType: z.string().optional().describe('Type of report'),
  }),
  outputSchema: z.object({
    report: z.string(),
  }),
})
  .then(synthesisStep)
  .commit();
