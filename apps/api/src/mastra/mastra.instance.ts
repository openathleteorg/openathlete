import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

import { createOpenAthleteCoachAssistant } from './index';

const logger = new PinoLogger({
  name: 'OpenAthlete-Mastra',
  level:
    (process.env.MASTRA_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') ||
    'debug',
});

const coachAssistant = createOpenAthleteCoachAssistant();

export const mastra = new Mastra({
  agents: {
    'openathlete-coach': coachAssistant,
  },
  logger,
});

export { coachAssistant };
