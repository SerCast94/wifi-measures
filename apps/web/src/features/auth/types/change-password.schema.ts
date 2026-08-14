import * as z from "zod";

export const changePasswordFormSchema = z
  .object({
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 6, {
        message: "La contraseña debe tener al menos 6 caracteres",
      })
      .refine((val) => !val || val.length <= 20, {
        message: "La contraseña no puede tener más de 20 caracteres",
      }),
    passwordConfirm: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.passwordConfirm !== data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["passwordConfirm"],
    }
  );

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
