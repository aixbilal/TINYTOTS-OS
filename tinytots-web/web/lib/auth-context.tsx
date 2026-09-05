"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TEMPORARY DIAGNOSTIC — remove once the post-login navigation latency root
// cause is found. Timing only; never reads/logs email/password/session/token.
function loginNavSince(): number | null {
  if (typeof window === "undefined") return null;
  const start = window.sessionStorage.getItem("tinytots_login_nav_start");
  return start ? Date.now() - Number(start) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      // TEMPORARY DIAGNOSTIC
      console.log("[login-nav-timing]", {
        stage: "auth-getSession-resolved",
        sinceLoginNavStartMs: loginNavSince(),
        hasSession: !!session,
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // TEMPORARY DIAGNOSTIC
      console.log("[login-nav-timing]", {
        stage: "auth-state-change",
        sinceLoginNavStartMs: loginNavSince(),
        event,
        hasSession: !!session,
      });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}