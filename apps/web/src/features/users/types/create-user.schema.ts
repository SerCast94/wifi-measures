import * as z from "zod";

export const createFormSchema = z
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
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(20, "La contraseña no puede tener más de 20 caracteres"),
    passwordConfirm: z.string(),
    image: z
      .string()
      .max(255, "La URL de la imagen no puede tener más de 255 caracteres"),
    roles: z.array(z.string()),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"], // Aplica el error solo a passwordConfirm
  });

export type CreateFormValues = z.infer<typeof createFormSchema>;
