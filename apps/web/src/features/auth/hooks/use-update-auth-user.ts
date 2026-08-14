import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { useAuth } from "../providers/AuthProvider";
import { updateAuthUser } from "../api/update-auth-user";
import { type Session, type UpdateUserData } from "../types/session.types";

export const useUpdateAuthUser = () => {
  const queryClient = useQueryClient();
  const { setSession } = useAuth();

  const mutation = useMutation<Session, AppError, UpdateUserData>({
    mutationFn: updateAuthUser,
    onSuccess: async (session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
    },
  });

  return mutation;
};
