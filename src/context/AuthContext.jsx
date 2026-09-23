import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

async function checkIsAdmin(userId) {
  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin provera:", error);
    return false;
  }

  return Boolean(data);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSession(currentSession);

      const adminStatus = await checkIsAdmin(
        currentSession?.user?.id
      );

      if (!active) {
        return;
      }

      setIsAdmin(adminStatus);
      setLoading(false);
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);

        if (!nextSession?.user?.id) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setLoading(true);

        checkIsAdmin(nextSession.user.id).then(
          (adminStatus) => {
            if (!active) {
              return;
            }

            setIsAdmin(adminStatus);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw error;
    }

    const adminStatus = await checkIsAdmin(
      data.user?.id
    );

    if (!adminStatus) {
      await supabase.auth.signOut();

      throw new Error(
        "Ovaj nalog nema administratorski pristup."
      );
    }

    setSession(data.session);
    setIsAdmin(true);

    return data;
  }

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setIsAdmin(false);
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth mora biti unutar AuthProvider-a."
    );
  }

  return context;
}