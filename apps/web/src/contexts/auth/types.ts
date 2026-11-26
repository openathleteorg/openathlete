import { User } from '@openathlete/shared';

export type ActionMapType<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export type AuthStateType = {
  status?: string;
  loading: boolean;
  /** The API could not be reached: the stored session is kept for a retry */
  offline: boolean;
  user: User | null;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  offline: boolean;
  initialize: (options?: { authenticated?: boolean }) => Promise<void>;
  logout: (navigate?: (path: string) => void) => void;
};
