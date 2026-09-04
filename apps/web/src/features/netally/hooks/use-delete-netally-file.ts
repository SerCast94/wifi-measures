import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import type { Unit } from "@/features/netally/types/netally.types";
import { deleteNetAllyFile } from "../api/delete-netally-file";

export const useDeleteUnitFile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { deleted: boolean },
    AppError,
    string,
    { previous?: Unit[] }
  >({
    mutationFn: deleteNetAllyFile,
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.units] });
      const previous = queryClient.getQueryData<Unit[]>([QUERY_KEYS.units]);

      if (previous) {
        queryClient.setQueryData<Unit[]>([QUERY_KEYS.units], (units) =>
          units?.map((unit) => ({
            ...unit,
            files: unit.files.filter(
              (file) => String(file.id) !== String(fileId)
            ),
          }))
        );
      }

      return { previous };
    },
    onError: (_error, _fileId, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEYS.units], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.units] });
    },
  });
};