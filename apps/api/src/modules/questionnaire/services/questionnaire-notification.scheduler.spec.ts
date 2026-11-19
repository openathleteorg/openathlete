import { reminderTime } from './questionnaire-notification.scheduler';

const HOUR = 3600 * 1000;
const start = new Date('2026-10-05T05:00:00Z');
const after = (hours: number) => new Date(start.getTime() + hours * HOUR);

describe('reminderTime', () => {
  it('reminds a day later when the questionnaire stays open a week', () => {
    expect(reminderTime(start, after(24 * 7))).toEqual(after(24));
  });

  it('reminds halfway when the next one comes sooner', () => {
    expect(reminderTime(start, after(24))).toEqual(after(12));
  });
});
