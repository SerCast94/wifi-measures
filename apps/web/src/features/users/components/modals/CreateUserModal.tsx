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
  createFormSchema,
  type CreateFormValues,
} from "../../types/create-user.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/core/atomic-components/dialog";
import { Input } from "@/core/atomic-components/input";
import { useCreateUser } from "../../hooks/use-create-user";
import { useUiUsersStore } from "../../store/ui-users.store";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import RolesSelector from "@/features/users/components/fields/RolesSelector";

const initialCreateValues: CreateFormValues = {
  name: "",
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
  image: "",
  roles: [],
};

export function CreateUserModal() {
  const isOpen = useUiUsersStore((state) => state.isOpenModalCreate);
  const setIsOpenModalCreate = useUiUsersStore(
    (state) => state.setIsOpenModalCreate
  );

  const { mutate: createUser, isPending: isCreating } = useCreateUser();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: initialCreateValues,
  });

  const {
    reset,
    formState: { errors, dirtyFields, isValid },
    setError,
  } = form;

  const handleFormSubmit = (data: CreateFormValues) => {
    createUser(data, {
      onSuccess: () => {
        setIsOpenModalCreate(false);
        reset(initialCreateValues);
        toast.success("Usuario creado correctamente");
      },
      onError: (error) => {
        if (error.formErrors) {
          const errors = error.formErrors;
          Object.entries(errors).forEach(([key, value]) => {
            setError(key as keyof CreateFormValues, {
              type: "manual",
              message: value[0] as string,
            });
          });
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpenModalCreate(false)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
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
                        required
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
                        required
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
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <LoadingButton
                loading={isCreating}
                disabled={_.isEmpty(dirtyFields) || !isValid || isCreating}
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
