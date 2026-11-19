import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { downloadFile, toCsv } from '@/utils/csv';
import { Download } from 'lucide-react';

import type {
  Questionnaire,
  QuestionnaireOccurrence,
} from '@openathlete/shared';

import { csvFileName, questionnaireTable } from './csv';

interface P {
  questionnaire: Questionnaire;
  occurrences: QuestionnaireOccurrence[];
  /** Across athletes: a column names each one */
  athletes?: { athleteId: number; firstName: string; lastName: string }[];
}

/**
 * The answers of the span as a CSV file, for a spreadsheet. A native app
 * has no download folder to reach.
 */
export function ExportAnswersButton({
  questionnaire,
  occurrences,
  athletes,
}: P) {
  if (isCapacitor() || occurrences.length === 0) return null;
  return (
    <Button
      variant="outline"
      data-export-answers={questionnaire.questionnaireId}
      onClick={() => {
        const { header, rows } = questionnaireTable(
          questionnaire,
          occurrences,
          athletes,
        );
        downloadFile(
          csvFileName(questionnaire.title),
          // The byte order mark tells spreadsheets the file is UTF-8
          new Blob(['﻿', toCsv(header, rows)], {
            type: 'text/csv;charset=utf-8',
          }),
        );
      }}
    >
      <Download className="size-4" />
      {m.questionnaire_export_csv()}
    </Button>
  );
}
