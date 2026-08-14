import * as z from "zod";

export const updateFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(100, "El nombre de usuario no puede tener más de 100 caracteres"),
    email: z
      .string()
      .email("Debe ser un email válido")
      .min(3, "El email debe tener al menos 3 caracteres")
      .max(100, "El email no puede tener más de 100 caracteres"),
    name: z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(100, "El nombre no puede tener más de 100 caracteres"),
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
    image: z
      .string()
      .max(255, "La URL de la imagen no puede tener más de 255 caracteres"),
    roles: z.array(z.string()),
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
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .superRefine((data: Record<string, any>) => {
    // Filtrar los campos vacíos del objeto final
    Object.keys(data).forEach((key) => {
      if (data[key] === "") {
        delete data[key];
      }
    });
  });

export type UpdateFormValues = z.infer<typeof updateFormSchema>;
