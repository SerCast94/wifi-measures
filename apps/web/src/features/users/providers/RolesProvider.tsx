import { createContext, useContext } from "react";

import { useQuery } from "@tanstack/react-query";

import { getRoles } from "../api/get-roles";
import { QUERY_KEYS } from "@/config/constants";
import { type Role } from "@/features/auth/types/user.type";
import CustomLoading from "@/core/components/CustomLoading";
import InternalError from "@/core/components/InternalError";

type RolesContextValue = {
  roles: Role[];
};

const RolesContext = createContext<RolesContextValue | undefined>(undefined);

export const RolesProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: roles,
    isLoading,
    isError,
    refetch,
  } = useQuery<unknown, Error, Role[]>({
    queryKey: [QUERY_KEYS.roles],
    queryFn: getRoles,
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
    <RolesContext.Provider
      value={{
        roles: roles || [],
      }}
    >
      {children}
    </RolesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRoles = () => {
  const context = useContext(RolesContext);

  if (context === undefined) {
    throw new Error("useRoles must be used within an RolesProvider");
  }

  return context;
};
