import {
  MANAGE_MEASURES,
  SYNC_MEASURES,
} from "../permissions/manage-measures.permissions";
import { MANAGE_USERS } from "../permissions/manage-users.permissions";

export interface SeederRole {
  name: string;
  label: string;
  description: string;
  permissions?: string[];
}

export const seederAdminRole: SeederRole = {
  name: "admin",
  label: "Administrador",
  description: "Rol de administrador",
};

export const seederRoles: SeederRole[] = [
  {
    name: "manage-users",
    label: "Gestor de usuarios",
    description: "Rol de gestor de usuarios y asignación de roles",
    permissions: [MANAGE_USERS],
  },
  {
    name: "user",
    label: "Usuario",
    description: "Rol de usuario estándar",
  },
  {
    name: "measure-manager",
    label: "Gestor de medidas",
    description: "Rol de gestor de medidas Wi‑Fi",
    permissions: [MANAGE_MEASURES, SYNC_MEASURES],
  },
];
