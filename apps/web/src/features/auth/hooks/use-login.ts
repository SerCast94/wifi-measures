import { useMutation } from "@tanstack/react-query";

import { login } from "../api/login";
import {
  type LoginError,
  type LoginRequest,
} from "@/features/auth/types/sign-in.types";
import { useAuth } from "../providers/AuthProvider";
import { type Session } from "../types/session.types";

export const useLogin = () => {
  const { setSession } = useAuth();

  const mutation = useMutation<Session, LoginError, LoginRequest>({
    mutationFn: login,
    onSuccess: async (session) => {
      setSession(session);
    },
  });

  return mutation;
};
