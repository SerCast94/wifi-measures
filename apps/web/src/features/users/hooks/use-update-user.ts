import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateUser } from "../api/update-user";
import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { type User } from "@/features/auth/types/user.type";
import { type UpdateFormValues } from "../types/update-user.schema";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    User,
    AppError,
    { userId: string; data: UpdateFormValues }
  >({
    mutationFn: updateUser,
    onSuccess: async (updatedUser: User) => {
      queryClient.setQueryData<User[]>([QUERY_KEYS.users], (oldUsers) => {
        return oldUsers ? [...oldUsers, updatedUser] : [updatedUser];
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.session] });
    },
  });

  return mutation;
};
