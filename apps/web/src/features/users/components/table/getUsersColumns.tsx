import { type ColumnDef } from "@tanstack/react-table";

import { cn } from "@/core/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/atomic-components/avatar";
import { Badge } from "@/core/atomic-components/badge";
import { type Role, type User } from "@/features/auth/types/user.type";
import { UserActionButtonsCell } from "../actions-buttons/UserActionButtonsCell";

export const getUsersColumns = (roles: Role[]): ColumnDef<User>[] => [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => {
      const avatarFallback = row.original.name!.charAt(0).toUpperCase();
      return (
        <Avatar
          className={cn(
            "my-2 transition rounded-md size-10",
            row.original.active ? "opacity-100" : "opacity-30"
          )}
        >
          <AvatarImage
            className="rounded-md"
            alt={row.original.name}
            src={row.original.image}
          />
          <AvatarFallback className="text-xs font-bold text-white rounded-md bg-primary text-primary-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      );
    },
    enableColumnFilter: false,
    enableSorting: false,
  },
  {
    accessorKey: "username",
    header: "Nombre de Usuario",
    cell: ({ row }) => (
      <div
        className={cn(
          "table-cell w-[100px]",
          row.original.active ? "opacity-100" : "opacity-30 line-through"
        )}
      >
        {row.original.username}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div
        className={cn(
          "truncate w-[200px]",
          row.original.active ? "opacity-100" : "opacity-30 line-through"
        )}
      >
        {row.original.email}
      </div>
    ),
    meta: { className: "hidden lg:table-cell" },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div
        className={cn(
          "truncate w-[150px]",
          row.original.active ? "opacity-100" : "opacity-30 line-through"
        )}
      >
        {row.original.name}
      </div>
    ),
    meta: { className: "hidden sm:table-cell" },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de Creación",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      const dateLabel = date.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <div
          className={cn(
            "table-cell sm:w-[150px]",
            row.original.active ? "opacity-100" : "opacity-30 line-through"
          )}
        >
          {dateLabel}
        </div>
      );
    },
    meta: { className: "hidden xl:table-cell" },
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => (
      <div
        className={cn(
          "max-w-[500px] flex flex-wrap gap-2",
          row.original.active ? "opacity-100" : "opacity-30"
        )}
      >
        {row.original.roles.map((role) => (
          <Badge key={role} variant="default" className="mr-2 font-bold">
            {/* Traducir el role al nombre del rol con la variable roles */}
            {roles.find((r) => r.name === role)?.label}
          </Badge>
        ))}
      </div>
    ),
    meta: { className: "hidden xl:table-cell" },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <UserActionButtonsCell user={row.original} />,
  },
];
