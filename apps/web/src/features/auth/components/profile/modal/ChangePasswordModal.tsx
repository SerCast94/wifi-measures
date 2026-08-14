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
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/features/auth/types/change-password.schema";
import { Input } from "@/core/atomic-components/input";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useUiProfileStore } from "@/features/auth/store/ui-profile.store";
import { useUpdateAuthUser } from "@/features/auth/hooks/use-update-auth-user";

const initialUpdateValues: ChangePasswordFormValues = {
  password: "",
  passwordConfirm: "",
};

export function ChangePasswordModal() {
  const isOpen = useUiProfileStore((state) => state.isOpenModalChangePassword);
  const setOpen = useUiProfileStore(
    (state) => state.setIsOpenModalChangePassword
  );
  const { mutate: updateUser, isPending: isUpdating } = useUpdateAuthUser();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: initialUpdateValues,
  });

  const {
    formState: { errors, dirtyFields, isValid },
    setError,
  } = form;

  const handleFormSubmit = (data: ChangePasswordFormValues) => {
    updateUser(data, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Contraseña modificada correctamente");
      },
      onError: (error) => {
        if (error.formErrors) {
          const errors = error.formErrors;
          Object.entries(errors).forEach(([key, value]) => {
            setError(key as keyof ChangePasswordFormValues, {
              type: "manual",
              message: value[0] as string,
            });
          });
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpen(false)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
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
