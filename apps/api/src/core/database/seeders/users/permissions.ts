import { manageUsersPermissions } from "../permissions/manage-users.permissions";
import { manageMeasuresPermissions } from "../permissions/manage-measures.permissions";

export const permissions = [
  ...manageUsersPermissions,
  ...manageMeasuresPermissions,
];
