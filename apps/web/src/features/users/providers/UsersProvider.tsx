import { createContext, useContext } from "react";

import { useQuery } from "@tanstack/react-query";

import { getUsers } from "../api/get-users";
import { QUERY_KEYS } from "@/config/constants";
import { type User } from "@/features/auth/types/user.type";
import CustomLoading from "@/core/components/CustomLoading";
import InternalError from "@/core/components/InternalError";

type UsersContextValue = {
  users: User[];
};

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery<unknown, Error, User[]>({
    queryKey: [QUERY_KEYS.users],
    queryFn: getUsers,
    retry: false,
    //  5 minutes in development, 1 hour in production
    staleTime:
      process.env.NODE_ENV === "development" ? 1000 * 60 * 5 : 1000 * 60 * 60,
  });

  if (isError) {
    return (
      <InternalError message="Error al cargar los usuarios" onRetry={refetch} />
    );
  }

  if (isLoading) {
    return <CustomLoading />;
  }

  return (
    <UsersContext.Provider
      value={{
        users: users || [],
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const context = useContext(UsersContext);

  if (context === undefined) {
    throw new Error("useUsers must be used within an UsersProvider");
  }

  return context;
};
