import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { deleteUser } from "../api/delete-user";
import { AppError } from "@/core/models/app-error";
import { type User } from "@/features/auth/types/user.type";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<string, AppError, { userId: string }>({
    mutationFn: deleteUser,
    onSuccess: async (userDeletedId: string) => {
      queryClient.setQueryData<User[]>([QUERY_KEYS.users], (oldUsers) => {
        return oldUsers
          ? oldUsers.filter((user) => user.id === userDeletedId)
          : oldUsers;
      });
    },
  });

  return mutation;
};
