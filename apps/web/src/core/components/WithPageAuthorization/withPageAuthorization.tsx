import { type FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import CustomLoading from "../CustomLoading";
import { useUser } from "@/features/auth/providers/UserProvider";

interface WithPageAuthorizationProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
  searchMode?: "any" | "all";
}

export function withPageAuthorization<T extends object>(
  WrappedComponent: FC<T>,
  {
    requiredRoles,
    requiredPermissions,
    redirectTo = "/home",
    searchMode = "any",
  }: WithPageAuthorizationProps
) {
  return (props: T) => {
    const { user } = useUser();
    const navigate = useNavigate();

    const hasRequiredRole = requiredRoles
      ? searchMode === "any"
        ? user.roles.some((role: string) => requiredRoles.includes(role))
        : requiredRoles.every((role: string) => user.roles.includes(role))
      : true;

    const hasRequiredPermission = requiredPermissions
      ? searchMode === "any"
        ? user.permissions.some((permission: string) =>
            requiredPermissions.includes(permission)
          )
        : requiredPermissions.every((permission: string) =>
            user.permissions.includes(permission)
          )
      : true;

    useEffect(() => {
      const isAuthorized =
        searchMode === "any"
          ? !hasRequiredRole || !hasRequiredPermission
          : !hasRequiredRole && !hasRequiredPermission;

      if (isAuthorized) {
        toast.error("No tienes permisos para acceder a esta página");
        navigate(redirectTo);
      }
    }, [hasRequiredRole, hasRequiredPermission, navigate]);

    if (
      (searchMode === "any" && (!hasRequiredRole || !hasRequiredPermission)) ||
      (searchMode === "all" && !hasRequiredRole && !hasRequiredPermission)
    ) {
      return <CustomLoading />;
    }

    return <WrappedComponent {...props} />;
  };
}
