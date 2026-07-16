"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type AdminRole = "admin" | "order_manager" | "support" | "inventory_only";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
};

type AdminAuthContextType = {
  session: Session | null;
  admin: AdminProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAdminProfile(currentSession: Session | null) {
    if (!currentSession) {
      setAdmin(null);
      return;
    }
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, name, email, role, is_active")
      .eq("auth_user_id", currentSession.user.id)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      setAdmin(null);
      return;
    }
    setAdmin(data as AdminProfile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await loadAdminProfile(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await loadAdminProfile(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ session, admin, loading, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}