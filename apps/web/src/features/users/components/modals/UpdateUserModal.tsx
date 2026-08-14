import _ from "lodash";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/core/atomic-components/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/core/atomic-components/dialog";
import { Input } from "@/core/atomic-components/input";
import { useUiUsersStore } from "../../store/ui-users.store";
import { useUser } from "@/features/auth/providers/UserProvider";
import {
  updateFormSchema,
  type UpdateFormValues,
} from "../../types/update-user.schema";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import RolesSelector from "@/features/users/components/fields/RolesSelector";
import { useRoles } from "../../providers/RolesProvider";
import { useEffect } from "react";
import { useUpdateUser } from "../../hooks/use-update-user";

const initialUpdateValues: UpdateFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
  image: "",
  roles: [],
};

export function UpdateUserModal() {
  const { user: authUser } = useUser();
  const { roles } = useRoles();
  const user = useUiUsersStore((state) => state.userToUpdate);
  const isAuthUser = user?.id === authUser.id;
  const isOpen = useUiUsersStore((state) => state.isOpenModalUpdate);
  const closeModal = useUiUsersStore((state) => state.closeModalUpdate);
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: initialUpdateValues,
  });

  const {
    formState: { errors, dirtyFields, isValid },
    setError,
  } = form;

  const handleFormSubmit = (data: UpdateFormValues) => {
    updateUser(
      { userId: user?.id || "", data },
      {
        onSuccess: () => {
          closeModal();
          toast.success("Usuario editado correctamente");
        },
        onError: (error) => {
          if (error.formErrors) {
            const errors = error.formErrors;
            Object.entries(errors).forEach(([key, value]) => {
              setError(key as keyof UpdateFormValues, {
                type: "manual",
                message: value[0] as string,
              });
            });
          } else {
            toast.error("Error al editar el usuario - " + error.message);
          }
        },
      }
    );
  };

  useEffect(() => {
    if (user) {
      // Se asigna el valor de user a los campos del formulario
      form.reset({
        name: user?.name || "",
        username: user?.username || "",
        email: user?.email || "",
        password: "",
        passwordConfirm: "",
        image: user?.image || "",
        roles:
          user?.roles.map((role) => {
            const foundRole = roles.find((r) => r.name === role);
            return foundRole?.id || role;
          }) || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nombre de Usuario:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mb-24"
                        autoFocus
                        type="text"
                        value={field.value}
                        required
                        placeholder="Escribe tu nombre de usuario"
                        error={errors.username?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Correo Electrónico:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mb-24"
                        type="text"
                        value={field.value}
                        required
                        placeholder="Escribe tu correo electrónico"
                        error={errors.email?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row max-w-[270px]">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nombre:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mb-24"
                        type="text"
                        value={field.value}
                        required
                        placeholder="Escribe tu nombre"
                        error={errors.name?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Contraseña:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mb-24"
                        type="password"
                        value={field.value}
                        placeholder="Escribe tu contraseña"
                        error={errors.password?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Confirmar Contraseña:</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mb-24"
                        type="password"
                        value={field.value}
                        placeholder="Confirma tu contraseña"
                        error={errors.passwordConfirm?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row max-w-[270px]">
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Roles:</FormLabel>
                    <FormControl>
                      <RolesSelector
                        {...field}
                        values={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.roles?.message}
                        disabled={isAuthUser}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <LoadingButton
                loading={isUpdating}
                disabled={_.isEmpty(dirtyFields) || !isValid || isUpdating}
                type="submit"
                icon={<SaveIcon className="w-4 h-4 mr-2" />}
              >
                Guardar
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
