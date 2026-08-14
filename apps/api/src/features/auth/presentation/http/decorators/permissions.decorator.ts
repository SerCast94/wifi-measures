import { SetMetadata } from "@nestjs/common";

export const HAS_PERMISSIONS_KEY = "has-permissions";
export const HasPermissions = (
  permissions: string[] | string,
  searchMode: "any" | "all" = "all"
) => SetMetadata(HAS_PERMISSIONS_KEY, { permissions, searchMode });
