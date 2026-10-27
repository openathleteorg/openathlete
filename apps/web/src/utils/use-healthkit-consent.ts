import { useEffect, useRef, useState } from 'react';

import {
  type HealthKitBinding,
  type HealthKitSelection,
  type HealthSyncConsent,
  type HealthSyncKind,
  type HealthWorkoutSelection,
  localHealthKit,
} from './healthkit';

const denied: HealthSyncConsent = {
  read: false,
  upload: false,
  automatic: false,
};

/** Native settings survive views/restarts and bind consent to one exact scope. */
export function useHealthKitConsent(
  binding: HealthKitBinding,
  kind: HealthSyncKind,
  selection: HealthKitSelection | HealthWorkoutSelection,
  enabled: boolean,
) {
  const scope = JSON.stringify(
    'types' in selection
      ? { ...selection, types: [...selection.types].sort() }
      : selection,
  );
  const key = `${binding.apiBaseURL}:${binding.accountID}:${kind}:${scope}`;
  const [saved, setSaved] = useState({ key: '', value: denied });
  const latest = useRef({ key: '', value: denied });
  const request = useRef(0);
  const mountedKey = useRef(key);
  mountedKey.current = key;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = () => {
      const current = ++request.current;
      localHealthKit
        .syncSettings({
          apiBaseURL: binding.apiBaseURL,
          accountID: binding.accountID,
          kind,
          selection: JSON.parse(scope),
        })
        .then((value) => {
          if (active && request.current === current) {
            latest.current = { key, value };
            setSaved({ key, value });
          }
        })
        .catch(() => {
          if (active && request.current === current) {
            latest.current = { key, value: denied };
            setSaved({ key, value: denied });
          }
        });
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [enabled, binding.apiBaseURL, binding.accountID, kind, scope, key]);
  const update = (
    patch: Partial<Pick<HealthSyncConsent, 'read' | 'upload' | 'automatic'>>,
  ) => {
    if (!enabled) return;
    const value = {
      ...(latest.current.key === key ? latest.current.value : denied),
      ...patch,
    };
    if (!value.read || !value.upload) value.automatic = false;
    const current = ++request.current;
    latest.current = { key, value };
    setSaved({ key, value });
    void localHealthKit
      .syncSettings({
        ...binding,
        kind,
        selection,
        read: value.read,
        upload: value.upload,
        automatic: value.automatic,
      })
      .then((result) => {
        if (mountedKey.current === key && request.current === current) {
          latest.current = { key, value: result };
          setSaved({ key, value: result });
        }
      })
      .catch(() => {
        if (mountedKey.current === key && request.current === current) {
          latest.current = { key, value: denied };
          setSaved({ key, value: denied });
        }
      });
  };
  return { ...(saved.key === key ? saved.value : denied), update };
}
