import { ValidationPipe, BadRequestException } from "@nestjs/common";

export const validationPipe = new ValidationPipe({
  transform: true, // Enable transformation
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => {
    // TODO: Formatear error cuando en la validación hay nested objects
    const formattedErrors = errors.reduce(
      (result, error) => {
        result[error.property] = Object.values(error.constraints || {});
        return result;
      },
      {} as Record<string, string[]>
    );
    throw new BadRequestException({
      message: "Existen errores de validación. Por favor, revise los campos.",
      validationErrors: formattedErrors,
      error: "VALIDATION_FAILED",
    });
  },
});
