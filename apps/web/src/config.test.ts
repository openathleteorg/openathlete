import { afterEach, describe, expect, it, vi } from 'vitest';

import { socketUrl } from './config';

const server = vi.hoisted(() => ({ url: '' }));
vi.mock('./utils/capacitor', () => ({ getApiBaseUrl: () => server.url }));
vi.mock('./routes/paths', () => ({ getPath: () => '/dashboard' }));

describe('socketUrl', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the API origin rather than the HTTP proxy prefix for native apps', () => {
    server.url = 'https://train.example.org/api';
    expect(socketUrl('calendar')).toBe('https://train.example.org/calendar');
    server.url = 'https://train.example.org/api/';
    expect(socketUrl('messages')).toBe('https://train.example.org/messages');
  });

  it('preserves API origins without a proxy prefix', () => {
    server.url = 'https://api.example.org';
    expect(socketUrl('calendar')).toBe('https://api.example.org/calendar');
  });

  it('uses the page origin for a relative API URL', () => {
    server.url = '/api';
    vi.stubGlobal('window', {
      location: { origin: 'https://train.example.org' },
    });
    expect(socketUrl('calendar')).toBe('https://train.example.org/calendar');
  });
});
