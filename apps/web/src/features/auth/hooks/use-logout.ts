import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

import { logout } from "../api/logout";
import { useAuth } from "../providers/AuthProvider";

export const useLogout = () => {
  const { clearSession } = useAuth();

  const mutation = useMutation<unknown, AxiosError<unknown>>({
    mutationFn: logout,
    onSettled: () => {
      clearSession();
    },
  });

  return mutation;
};
