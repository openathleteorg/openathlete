import { Capacitor, registerPlugin } from '@capacitor/core';

export type ZwiftBinding = { apiBaseURL: string; accountID: string };
export interface ZwiftPlugin {
  status(binding: ZwiftBinding): Promise<{ connected: boolean }>;
  connect(
    input: ZwiftBinding & { username: string; password: string },
  ): Promise<{ connected: boolean }>;
  disconnect(binding: ZwiftBinding): Promise<void>;
  upload(
    input: ZwiftBinding & { eventID: number; xml: string },
  ): Promise<{ verified: boolean }>;
}
export const localZwift = registerPlugin<ZwiftPlugin>('OpenAthleteZwift');
export const hasLocalZwift = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
