import { UserAPI } from '@/api/user';
import { getPath } from '@/routes/paths';
import { isValidToken } from '@/utils/auth';
import { isNetworkError } from '@/utils/axios';
import { getApiBaseUrl } from '@/utils/capacitor';
import { signOutFirebase } from '@/utils/firebase-auth';
import {
  bindLocalHealthSession,
  clearLocalHealthSession,
} from '@/utils/healthkit';
import { saveLanguageChoice } from '@/utils/language-choice';
import { ACCESS_TOKEN, clear, getItem, setItem } from '@/utils/local-storage';
import { initializePushNotifications } from '@/utils/push-notifications';
import { queryClient } from '@/utils/query-client';
import { saveTimeZone } from '@/utils/time-zone';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { User } from '@openathlete/shared';

import { ActionMapType, AuthContextType, AuthStateType } from '../types';
import { AuthContext } from './auth-context';

const Types = {
  INITIAL: 'INITIAL',
  OFFLINE: 'OFFLINE',
  LOGOUT: 'LOGOUT',
} as const;

type Types = (typeof Types)[keyof typeof Types];

const reducer = (state: AuthStateType, action: ActionsType) => {
  if (action.type === Types.INITIAL) {
    return {
      loading: false,
      offline: false,
      user: action.payload.user,
    };
  }
  if (action.type === Types.OFFLINE) {
    return {
      loading: false,
      offline: true,
      user: null,
    };
  }
  if (action.type === Types.LOGOUT) {
    return {
      ...state,
      offline: false,
      user: null,
    };
  }
  return state;
};

type Props = {
  children: React.ReactNode;
};

type Payload = {
  [Types.INITIAL]: {
    user: User | null;
  };
  [Types.OFFLINE]: undefined;
  [Types.LOGOUT]: undefined;
};

type ActionsType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

const initialState: AuthStateType = {
  user: null,
  loading: true,
  offline: false,
};

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initializing = useRef<Promise<void> | null>(null);
  const generation = useRef(0);

  const initialize = useCallback(() => {
    if (initializing.current) return initializing.current;
    const expected = generation.current;
    const current = () => generation.current === expected;
    const check = async () => {
      try {
        const accessToken = getItem(ACCESS_TOKEN);
        if (accessToken && isValidToken(accessToken)) {
          setItem(ACCESS_TOKEN, accessToken);
        }
        const user = await UserAPI.getMe();
        if (!current()) return;
        await saveLanguageChoice(user.language);
        if (!current()) return;
        void saveTimeZone(user.timeZone);
        posthog.identify(user.userId.toString(), { roles: user.roles });
        dispatch({ type: Types.INITIAL, payload: { user } });
        initializePushNotifications()
          .then(() => {
            if (!current()) return;
            return import('@/utils/push-notifications').then(
              ({ sendPendingTokenIfAny }) => {
                if (current()) sendPendingTokenIfAny();
              },
            );
          })
          .catch((error) => {
            console.error('Failed to initialize push notifications:', error);
          });
      } catch (error) {
        if (!current()) return;
        // An unanswered request leaves the session unknown; retain credentials.
        dispatch(
          isNetworkError(error)
            ? { type: Types.OFFLINE }
            : { type: Types.INITIAL, payload: { user: null } },
        );
      }
    };
    const pending = check();
    initializing.current = pending;
    void pending.finally(() => {
      if (initializing.current === pending) initializing.current = null;
    });
    return pending;
  }, []);

  const logout = useCallback(async (navigate?: (path: string) => void) => {
    generation.current += 1;
    initializing.current = null;
    await clearLocalHealthSession().catch(() => undefined);
    posthog.capture('user_logged_out');
    posthog.reset();
    clear();
    // The cache outlives an in-app logout. The next account to sign in on
    // this tab would get this one's data, including the profile that tells
    // the guard whether to send a new account to the onboarding.
    queryClient.clear();
    signOutFirebase().catch((error) => {
      console.error('Failed to sign out Firebase:', error);
    });
    dispatch({
      type: Types.LOGOUT,
    });
    const loginPath = getPath(['auth', 'login']);
    if (navigate) {
      navigate(loginPath);
    } else {
      window.location.href = loginPath;
    }
  }, []);

  useEffect(() => {
    void initialize();
    return () => {
      generation.current += 1;
      initializing.current = null;
    };
  }, [initialize]);

  useEffect(() => {
    const update = () => {
      if (state.user) {
        void bindLocalHealthSession({
          apiBaseURL: getApiBaseUrl(),
          accountID: String(state.user.userId),
        }).catch(() => undefined);
      }
    };
    update();
    window.addEventListener('openathlete-session-token', update);
    return () =>
      window.removeEventListener('openathlete-session-token', update);
  }, [state.user]);

  // A failed native request does not imply a connectivity transition. Retry
  // while visible, and when returning to the app, even without an online event.
  useEffect(() => {
    if (!state.offline) return;
    let active = true;
    let delay = 2_000;
    let timer: ReturnType<typeof setTimeout>;
    const retry = async () => {
      clearTimeout(timer);
      if (!active || document.visibilityState !== 'visible') return;
      await initialize();
      if (!active) return;
      timer = setTimeout(() => void retry(), delay);
      delay = Math.min(delay * 2, 30_000);
    };
    const wake = () => {
      delay = 2_000;
      void retry();
    };
    timer = setTimeout(() => void retry(), delay);
    window.addEventListener('online', wake);
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('online', wake);
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [state.offline, initialize]);

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo<AuthContextType>(
    () => ({
      user: state.user,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated' && !state.offline,
      offline: state.offline,
      initialize,
      logout,
    }),
    [state.user, state.offline, status, initialize, logout],
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
}
