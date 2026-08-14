import { createContext, useContext } from "react";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getSession } from "../api/get-session";
import { type Session } from "../types/session.types";
import SplashScreen from "@/core/components/SplashScreen";
import { initSessionCache } from "../lib/initSessionCache";
import { clearSessionCache } from "@/features/auth/lib/clearSessionCache";

type AuthContextValue = {
  session: Session | null | undefined;
  setSession: (session: Session) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: session,
    isLoading,
    isError,
  } = useQuery<unknown, Error, Session>({
    queryKey: [QUERY_KEYS.session],
    queryFn: getSession,
    retry: false,
    //  30 seconds in development, 1 hour in production
    staleTime:
      process.env.NODE_ENV === "development" ? 1000 * 30 * 1 : 1000 * 60 * 60,
  });

  const setSession = (newSession: Session) => {
    initSessionCache(newSession);
  };

  const clearSession = () => {
    clearSessionCache();
  };

  if (isError) {
    clearSession();
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
