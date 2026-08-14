import axios from "axios";

import { AppError, type FormErrors } from "../models/app-error";
import { type ApiErrorResponse } from "../types/api-responses.types";

/**
 * Maneja los errores provenientes de llamadas a la API
 * y lanza una instancia de la excepción personalizada AppError.
 *
 * @param error - Error capturado en el bloque catch.
 * @returns Nunca retorna un valor, siempre lanza una excepción.
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const apiErrorResponse = error.response.data as ApiErrorResponse;

      // Transformar el error de validación si existe
      const formErrors: FormErrors | undefined =
        apiErrorResponse.validationErrors
          ? Object.entries(
              apiErrorResponse.validationErrors
            ).reduce<FormErrors>((acc, [field, errors]) => {
              acc[field] = errors;
              return acc;
            }, {})
          : undefined;

      throw new AppError(
        apiErrorResponse.message || "Error desconocido en la API",
        error.response.status,
        formErrors
      );
    }

    if (error.request) {
      throw new AppError(
        "Error de red: no se recibió respuesta del servidor",
        0 // Usar 0 para indicar un error de red
      );
    }

    throw new AppError(`Error al realizar la solicitud: ${error.message}`, 0);
  }

  if (error instanceof Error) {
    throw new AppError(error.message, 0);
  }

  throw new AppError("Ocurrió un error desconocido", 0);
}
