import { MANAGE_USERS } from "@/config/constants";
import { UsersProvider } from "@/features/users/providers/UsersProvider";
import { RolesProvider } from "@/features/users/providers/RolesProvider";
import { UsersTable } from "@/features/users/components/table/UsersTable";
import { CreateUserModal } from "@/features/users/components/modals/CreateUserModal";
import { UpdateUserModal } from "@/features/users/components/modals/UpdateUserModal";
import { GlobalUsersFilter } from "@/features/users/components/filters/GlobalUsersFilter";
import { withPageAuthorization } from "@/core/components/WithPageAuthorization/withPageAuthorization";
import { OpenCreateUserModalBtn } from "@/features/users/components/actions-buttons/OpenCreateUserModalBtn";

const UsersPage = () => {
  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-8 sm:py-8 xl:px-16 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mb-4 sm:flex-row">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <div className="flex gap-4">
          <GlobalUsersFilter className="w-full sm:w-64" />
          <OpenCreateUserModalBtn />
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {/* Botones de acción compartida */}
      </div>
      <UsersTable />
      <CreateUserModal />
      <UpdateUserModal />
    </div>
  );
};

const UsersPageWrapper = () => {
  return (
    <UsersProvider>
      <RolesProvider>
        <UsersPage />
      </RolesProvider>
    </UsersProvider>
  );
};

const AuthorizedUsersPageWrapper = withPageAuthorization(UsersPageWrapper, {
  requiredPermissions: [MANAGE_USERS],
});

export default AuthorizedUsersPageWrapper;
