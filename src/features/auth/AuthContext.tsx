/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type AuthUser,
} from "../../services/auth";
import {
  createSupabaseBrowserClient,
  type SupabaseConfig,
} from "../../services/supabase";
import type { AuthClient } from "../../services/auth";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: AuthUser | null;
  client: AuthClient | null;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): AuthUser | null {
  return session?.user
    ? { id: session.user.id, email: session.user.email }
    : null;
}

function userFacingAuthError(error: unknown): string {
  if (error instanceof Error && /already registered/i.test(error.message)) {
    return "该邮箱已经注册，请直接登录。";
  }
  if (
    error instanceof Error &&
    /invalid login credentials/i.test(error.message)
  ) {
    return "邮箱或密码不正确。";
  }
  return "认证服务暂时不可用，请稍后重试。";
}

export function AuthProvider({
  children,
  client,
}: {
  children: ReactNode;
  client?: AuthClient | null;
}) {
  const [supabase] = useState<AuthClient | null>(() =>
    client === undefined ? createSupabaseBrowserClient() : client,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(userFacingAuthError(sessionError));
      setUser(userFromSession(data.session));
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(userFromSession(session));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: Boolean(supabase),
      loading,
      user,
      client: supabase,
      error,
      signIn: async (email, password) => {
        if (!supabase) {
          setError("尚未配置云端认证，请先设置 Supabase 环境变量。 ");
          return;
        }
        setError("");
        try {
          const nextUser = await signInWithPassword(supabase, email, password);
          setUser(nextUser);
        } catch (signInError) {
          setError(userFacingAuthError(signInError));
          throw signInError;
        }
      },
      signUp: async (email, password) => {
        if (!supabase) {
          setError("尚未配置云端认证，请先设置 Supabase 环境变量。 ");
          return false;
        }
        setError("");
        try {
          const nextUser = await signUpWithPassword(supabase, email, password);
          if (nextUser) setUser(nextUser);
          return Boolean(nextUser);
        } catch (signUpError) {
          setError(userFacingAuthError(signUpError));
          throw signUpError;
        }
      },
      signOut: async () => {
        if (!supabase) return;
        setError("");
        try {
          await signOut(supabase);
          setUser(null);
        } catch (signOutError) {
          setError(userFacingAuthError(signOutError));
          throw signOutError;
        }
      },
    }),
    [error, loading, supabase, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return value;
}

export function useOptionalAuth(): Pick<AuthContextValue, "user" | "client"> {
  return useContext(AuthContext) ?? { user: null, client: null };
}

export type { SupabaseConfig };
