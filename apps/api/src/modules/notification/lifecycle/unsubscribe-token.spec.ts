import {
  createUnsubscribeToken,
  readUnsubscribeToken,
} from './unsubscribe-token';

describe('unsubscribe tokens', () => {
  it('reads back the user and list it was made for', () => {
    const token = createUnsubscribeToken('secret', 42, 'recap');
    expect(token.startsWith('42.recap.')).toBe(true);
    expect(readUnsubscribeToken('secret', token)).toEqual({
      userId: 42,
      list: 'recap',
    });
  });

  it.each([
    ['another user', (t: string) => t.replace(/^42/, '43')],
    ['another list', (t: string) => t.replace('.recap.', '.news.')],
    ['a changed signature', (t: string) => `${t.slice(0, -1)}A`],
    ['extra parts', (t: string) => `${t}.x`],
    ['garbage', () => 'nothing'],
  ])('refuses %s', (_, tamper) => {
    const token = tamper(createUnsubscribeToken('secret', 42, 'recap'));
    expect(readUnsubscribeToken('secret', token)).toBeNull();
  });

  it('refuses a token signed with another secret', () => {
    const token = createUnsubscribeToken('other', 42, 'tips');
    expect(readUnsubscribeToken('secret', token)).toBeNull();
  });
});
