"use client";

import {
  useAuth as useClerkAuth,
  useClerk,
  useUser as useClerkUser,
} from "@clerk/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  type AuthUser,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
} from "./auth-client";
import { cacheCurrentUser } from "./current-user";
import { installApiFetchDefaults, setApiAuthTokenProvider } from "./api-client";
import { subscribeAuthEvents } from "./auth-events";
import { buildSignInPath, isAuthBypassPath, SIGN_IN_PATH } from "./auth-routes";
import {
  resolveAuthSessionState,
  type AuthSessionState,
  type ClerkUserLike,
} from "./auth-session-state";

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: (options?: { redirectTo?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    installApiFetchDefaults();
  }, []);

  const { signOut: clerkSignOut } = useClerk();
  const { getToken: getClerkToken } = useClerkAuth();
  const { isLoaded: clerkLoaded, user: clerkUser } = useClerkUser();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    "loading",
  );

  useEffect(() => {
    setApiAuthTokenProvider(async () => {
      if (!clerkLoaded || !clerkUser) return null;
      return getClerkToken();
    });
    return () => setApiAuthTokenProvider(null);
  }, [clerkLoaded, clerkUser, getClerkToken]);

  const handleUnauthenticated = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    cacheCurrentUser(null);

    if (typeof window === "undefined" || isAuthBypassPath(pathname)) {
      return;
    }

    router.replace(buildSignInPath(pathname ?? "/"));
  }, [pathname, router]);

  const applySessionState = useCallback(
    (nextState: AuthSessionState) => {
      setUser(nextState.user);
      setStatus(nextState.status);
      cacheCurrentUser(nextState.user);

      if (nextState.status === "unauthenticated") {
        handleUnauthenticated();
      }
    },
    [handleUnauthenticated],
  );

  const resolveCurrentSession = useCallback(
    (apiUser: AuthUser | null) =>
      resolveAuthSessionState({
        apiUser,
        clerkUser: clerkUser as unknown as ClerkUserLike | null,
        clerkLoaded,
      }),
    [clerkLoaded, clerkUser],
  );

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe();
      applySessionState(resolveCurrentSession(me));
    } catch {
      applySessionState(resolveCurrentSession(null));
    }
  }, [applySessionState, resolveCurrentSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeAuthEvents((event) => {
      if (event.type === "unauthorized") {
        applySessionState(resolveCurrentSession(null));
      }
    });
  }, [applySessionState, resolveCurrentSession]);

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin(username, password);
    setUser(u);
    setStatus("authenticated");
    cacheCurrentUser(u);
    return u;
  }, []);

  const logout = useCallback(
    async (options?: { redirectTo?: string }) => {
      const target = options?.redirectTo ?? SIGN_IN_PATH;
      try {
        await apiLogout();
      } catch {
        // Clerk-authenticated users may not have a legacy API cookie yet.
      } finally {
        setUser(null);
        setStatus("unauthenticated");
        cacheCurrentUser(null);
        if (clerkLoaded && clerkUser) {
          await clerkSignOut({ redirectUrl: target }).catch(() => {
            if (typeof window !== "undefined") router.replace(target);
          });
          return;
        }
        if (typeof window !== "undefined") {
          router.replace(target);
        }
      }
    },
    [clerkLoaded, clerkSignOut, clerkUser, router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
