import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

import { isCapacitor } from './capacitor';

/** A light tap on a selection change. Does nothing in a browser. */
export function hapticTap() {
  if (isCapacitor()) void Haptics.impact({ style: ImpactStyle.Light });
}

/** Confirms an action that finished, such as a pull to refresh. */
export function hapticSuccess() {
  if (isCapacitor()) {
    void Haptics.notification({ type: NotificationType.Success });
  }
}
