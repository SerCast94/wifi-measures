import { type FC } from "react";

import { useUser } from "@/features/auth/providers/UserProvider";

interface WithAuthorizationProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  searchMode?: "any" | "all";
}

export function withAuthorization<T extends object>(
  WrappedComponent: FC<T>,
  {
    requiredRoles,
    requiredPermissions,
    searchMode = "any",
  }: WithAuthorizationProps
) {
  return (props: T) => {
    const { user } = useUser();

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

    if (
      (searchMode === "any" && (!hasRequiredRole || !hasRequiredPermission)) ||
      (searchMode === "all" && !hasRequiredRole && !hasRequiredPermission)
    ) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
