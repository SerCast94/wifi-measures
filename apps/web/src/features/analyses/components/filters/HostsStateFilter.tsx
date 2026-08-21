import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useTableHostsStore } from "../../store/table-hosts.store";

interface HostsStateFilterProps {
  className?: string;
}

export const HostsStateFilter = ({ className }: HostsStateFilterProps) => {
  const stateFilter = useTableHostsStore((state) => state.stateFilter);
  const setStateFilter = useTableHostsStore((state) => state.setStateFilter);
  const setPagination = useTableHostsStore((state) => state.setPagination);
  const pagination = useTableHostsStore((state) => state.pagination);

  const handleChange = (value: string) => {
    setStateFilter(value);
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  return (
    <Select value={stateFilter} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        <SelectItem value="active">Activos</SelectItem>
        <SelectItem value="inactive">Inactivos</SelectItem>
      </SelectContent>
    </Select>
  );
};