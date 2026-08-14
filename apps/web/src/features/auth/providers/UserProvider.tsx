import { createContext, useContext } from "react";

import { useAuth } from "./AuthProvider";
import { type User } from "../types/user.type";

type UserContextValue = {
  user: User;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();

  if (!session?.user) {
    return null;
  }

  return (
    <UserContext.Provider value={{ user: session.user }}>
      {children}
    </UserContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within an UserProvider");
  }

  return context;
};
