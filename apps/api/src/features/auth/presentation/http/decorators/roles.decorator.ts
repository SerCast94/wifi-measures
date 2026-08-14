import { SetMetadata } from "@nestjs/common";

export const HAS_ROLES_KEY = "has-roles";
export const HasRoles = (
  roles: string[] | string,
  searchMode: "any" | "all" = "all"
) => SetMetadata(HAS_ROLES_KEY, { roles, searchMode });
