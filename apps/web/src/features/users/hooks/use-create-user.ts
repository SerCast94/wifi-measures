import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createUser } from "../api/create-user";
import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { type User } from "@/features/auth/types/user.type";
import { type CreateFormValues } from "../types/create-user.schema";

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<User, AppError, CreateFormValues>({
    mutationFn: createUser,
    onSuccess: async (newUser: User) => {
      queryClient.setQueryData<User[]>([QUERY_KEYS.users], (oldUsers) => {
        return oldUsers ? [...oldUsers, newUser] : [newUser];
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
    },
  });

  return mutation;
};
