import { QUERY_KEYS } from "@/config/constants";
import queryClient from "@/core/lib/queryClient";

let isSessionBeingCleared = false;

// Esta función limpia la caché de la sesión y elimina todas las demás consultas.
export const clearSessionCache = () => {
  if (isSessionBeingCleared) {
    return;
  }

  isSessionBeingCleared = true;

  queryClient.setQueryData([QUERY_KEYS.session], null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== QUERY_KEYS.session,
  });
  queryClient.setQueryDefaults([QUERY_KEYS.session], {
    enabled: false,
  });

  // Evita que se llame a clearSessionCache más de una vez en un ciclo de eventos.
  setTimeout(() => {
    isSessionBeingCleared = false;
  }, 0);
};
