import { useUser } from "@/features/auth/providers/UserProvider";

export const useHasPermission = (
  permission: string | string[]
): boolean => {
  const { user } = useUser();
  const required = Array.isArray(permission) ? permission : [permission];
  if (required.length === 0) return true;
  return required.some((perm) => user?.permissions?.includes(perm));
};
