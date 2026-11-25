import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import axios from 'axios';

import {
  getCurrentUser,
  logout as requestLogout,
  type AuthenticatedUser,
} from '@/features/auth/services/authService';
import {
  tokenStorage,
  TokenStorageError,
} from '@/services/storage/tokenStorage';

export type { AuthenticatedUser };

export type AuthInitializationError =
  | 'storage'
  | 'forbidden'
  | 'network'
  | 'server'
  | 'request';

type SettledAuthState =
  | { status: 'unauthenticated'; user: null }
  | { status: 'authenticated'; user: AuthenticatedUser }
  | {
      status: 'initialization-error';
      user: null;
      error: AuthInitializationError;
    };

type AuthState =
  | { status: 'initializing'; user: null }
  | SettledAuthState;

type InitializationResult = {
  state: SettledAuthState;
  invalidToken?: string;
};

type AuthContextValue = AuthState & {
  setAuthenticatedUser: (user: AuthenticatedUser) => void;
  clearAuthentication: () => void;
  logout: () => Promise<LogoutResult>;
  retryInitialization: () => Promise<void>;
};

export type LogoutResult = {
  remoteRevocationConfirmed: boolean;
  localTokenRemoved: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let pendingInitialization: Promise<InitializationResult> | null = null;

async function validateStoredSession(): Promise<InitializationResult> {
  let token: string | null;

  try {
    token = await tokenStorage.get();
  } catch {
    return {
      state: { status: 'initialization-error', user: null, error: 'storage' },
    };
  }

  if (!token) {
    return { state: { status: 'unauthenticated', user: null } };
  }

  try {
    const user = await getCurrentUser();
    return { state: { status: 'authenticated', user } };
  } catch (error) {
    if (error instanceof TokenStorageError) {
      return {
        state: { status: 'initialization-error', user: null, error: 'storage' },
      };
    }

    if (!axios.isAxiosError(error)) {
      return {
        state: { status: 'initialization-error', user: null, error: 'request' },
      };
    }

    const status = error.response?.status;

    if (status === 401) {
      return {
        state: { status: 'unauthenticated', user: null },
        invalidToken: token,
      };
    }

    if (status === 403) {
      return {
        state: { status: 'initialization-error', user: null, error: 'forbidden' },
      };
    }

    if (status === undefined) {
      return {
        state: { status: 'initialization-error', user: null, error: 'network' },
      };
    }

    return {
      state: {
        status: 'initialization-error',
        user: null,
        error: status >= 500 ? 'server' : 'request',
      },
    };
  }
}

function initializeSessionOnce(): Promise<InitializationResult> {
  if (!pendingInitialization) {
    pendingInitialization = validateStoredSession().finally(() => {
      pendingInitialization = null;
    });
  }

  return pendingInitialization;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: 'initializing',
    user: null,
  });
  const authRevision = useRef(0);
  const logoutPromise = useRef<Promise<LogoutResult> | null>(null);
  const retryPromise = useRef<Promise<void> | null>(null);

  const setAuthenticatedUser = useCallback((user: AuthenticatedUser) => {
    authRevision.current += 1;
    setState({ status: 'authenticated', user });
  }, []);

  const clearAuthentication = useCallback(() => {
    authRevision.current += 1;
    setState({ status: 'unauthenticated', user: null });
  }, []);

  const logout = useCallback((): Promise<LogoutResult> => {
    if (logoutPromise.current) {
      return logoutPromise.current;
    }

    // Invalidate any session validation already in flight before awaiting I/O.
    authRevision.current += 1;

    const operation = (async () => {
      let remoteRevocationConfirmed = false;
      let localTokenRemoved = false;

      try {
        remoteRevocationConfirmed = await requestLogout();
      } catch {
        // The local logout must still proceed when the backend is unavailable.
      }

      try {
        await tokenStorage.delete();
        localTokenRemoved = true;
      } catch {
        // Report the failed local cleanup to the caller without retaining auth state.
      }

      clearAuthentication();
      return { remoteRevocationConfirmed, localTokenRemoved };
    })();

    logoutPromise.current = operation;
    void operation.then(() => {
      if (logoutPromise.current === operation) {
        logoutPromise.current = null;
      }
    });
    return operation;
  }, [clearAuthentication]);

  const applyInitializationResult = useCallback(
    async (
      result: InitializationResult,
      isMounted: () => boolean,
      revisionAtStart: number,
    ) => {
      const canApply = () =>
        isMounted() && authRevision.current === revisionAtStart;

      if (!canApply()) {
        return;
      }

      if (result.invalidToken) {
        try {
          const currentToken = await tokenStorage.get();
          if (!canApply() || currentToken !== result.invalidToken) {
            return;
          }

          await tokenStorage.delete();
        } catch {
          if (canApply()) {
            setState({
              status: 'initialization-error',
              user: null,
              error: 'storage',
            });
          }
          return;
        }

        if (!canApply()) {
          return;
        }
      }

      setState(result.state);
    },
    [],
  );

  const retryInitialization = useCallback((): Promise<void> => {
    if (state.status !== 'initialization-error') {
      return Promise.resolve();
    }

    if (retryPromise.current) {
      return retryPromise.current;
    }

    authRevision.current += 1;
    const revisionAtStart = authRevision.current;
    setState({ status: 'initializing', user: null });

    const operation = (async () => {
      try {
        const result = await initializeSessionOnce();
        await applyInitializationResult(
          result,
          () => authRevision.current === revisionAtStart,
          revisionAtStart,
        );
      } catch {
        if (authRevision.current === revisionAtStart) {
          setState({
            status: 'initialization-error',
            user: null,
            error: 'request',
          });
        }
      }
    })();

    retryPromise.current = operation;
    const clearRetryPromise = () => {
      if (retryPromise.current === operation) {
        retryPromise.current = null;
      }
    };
    void operation.then(clearRetryPromise, clearRetryPromise);
    return operation;
  }, [applyInitializationResult, state.status]);

  useEffect(() => {
    let isMounted = true;
    const revisionAtStart = authRevision.current;

    void initializeSessionOnce()
      .then((result) =>
        applyInitializationResult(result, () => isMounted, revisionAtStart),
      )
      .catch(() => {
        if (isMounted && authRevision.current === revisionAtStart) {
          setState({ status: 'initialization-error', user: null, error: 'request' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applyInitializationResult]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setAuthenticatedUser,
      clearAuthentication,
      logout,
      retryInitialization,
    }),
    [state, setAuthenticatedUser, clearAuthentication, logout, retryInitialization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
