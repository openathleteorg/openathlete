import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

import { createOpenAthleteCoachAssistant } from './index';

const logger = new PinoLogger({
  name: 'OpenAthlete-Mastra',
  level: 'info',
});

const coachAssistant = createOpenAthleteCoachAssistant();

export const mastra = new Mastra({
  agents: {
    'openathlete-coach': coachAssistant,
  },
  logger,
});
