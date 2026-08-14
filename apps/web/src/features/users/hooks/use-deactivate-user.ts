import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { deactivateUser } from "../api/deactivate-user";
import { type User } from "@/features/auth/types/user.type";

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<User, AppError, { userId: string }>({
    mutationFn: deactivateUser,
    onSuccess: async (deactivatedUser: User) => {
      queryClient.setQueryData<User[]>([QUERY_KEYS.users], (oldUsers) => {
        // Check if the user is already in the list
        const userExists = oldUsers?.some(
          (user) => user.id === deactivatedUser.id
        );
        if (userExists) {
          // If the user exists, update the user in the list
          return oldUsers?.map((user) =>
            user.id === deactivatedUser.id ? deactivatedUser : user
          );
        } else {
          // If the user does not exist, add the new user to the list
          return oldUsers ? [...oldUsers, deactivatedUser] : [deactivatedUser];
        }
      });
    },
  });

  return mutation;
};
