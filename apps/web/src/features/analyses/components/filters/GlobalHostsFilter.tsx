import { Input } from "@/core/atomic-components/input";
import { useTableHostsStore } from "../../store/table-hosts.store";

interface GlobalHostsFilterProps {
  className?: string;
}

export const GlobalHostsFilter = ({ className }: GlobalHostsFilterProps) => {
  const globalFilter = useTableHostsStore((state) => state.globalFilter);
  const setGlobalFilter = useTableHostsStore((state) => state.setGlobalFilter);
  const setPagination = useTableHostsStore((state) => state.setPagination);
  const pagination = useTableHostsStore((state) => state.pagination);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
    if (e.target.value.length > 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  };

  return (
    <Input
      placeholder="Buscar dispositivos..."
      value={globalFilter ?? ""}
      onChange={handleChange}
      className={className}
    />
  );
};