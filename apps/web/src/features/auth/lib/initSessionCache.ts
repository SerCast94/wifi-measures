import { QUERY_KEYS } from "@/config/constants";
import queryClient from "@/core/lib/queryClient";
import { type Session } from "../types/session.types";

export const initSessionCache = (newSession: Session) => {
  queryClient.setQueryData([QUERY_KEYS.session], newSession);
  queryClient.setQueryDefaults([QUERY_KEYS.session], {
    enabled: true,
  });
};
