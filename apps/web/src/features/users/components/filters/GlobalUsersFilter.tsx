import { Input } from "@/core/atomic-components/input";
import { useTableUsersStore } from "../../store/table-users.store";

interface GlobalUsersFilterProps {
  className?: string;
}

export const GlobalUsersFilter = ({ className }: GlobalUsersFilterProps) => {
  const globalFilter = useTableUsersStore((state) => state.globalFilter);
  const setGlobalFilter = useTableUsersStore((state) => state.setGlobalFilter);
  const setPagination = useTableUsersStore((state) => state.setPagination);
  const pagination = useTableUsersStore((state) => state.pagination);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
    if (e.target.value.length > 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  };

  return (
    <Input
      placeholder="Buscar usuarios..."
      value={globalFilter ?? ""}
      onChange={handleChange}
      className={className}
    />
  );
};
