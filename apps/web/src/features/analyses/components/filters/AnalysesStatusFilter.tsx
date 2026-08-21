import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useTableAnalysesStore } from "../../store/table-analyses.store";

interface AnalysesStatusFilterProps {
  options: string[];
  className?: string;
}

export const AnalysesStatusFilter = ({
  options,
  className,
}: AnalysesStatusFilterProps) => {
  const statusFilter = useTableAnalysesStore((state) => state.statusFilter);
  const setStatusFilter = useTableAnalysesStore((state) => state.setStatusFilter);
  const setPagination = useTableAnalysesStore((state) => state.setPagination);
  const pagination = useTableAnalysesStore((state) => state.pagination);

  if (options.length === 0) return null;

  const handleChange = (value: string) => {
    setStatusFilter(value);
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  return (
    <Select value={statusFilter} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        {options.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};