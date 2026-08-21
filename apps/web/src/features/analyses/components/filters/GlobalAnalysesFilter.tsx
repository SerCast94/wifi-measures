import { Input } from "@/core/atomic-components/input";
import { useTableAnalysesStore } from "../../store/table-analyses.store";

interface GlobalAnalysesFilterProps {
  className?: string;
}

export const GlobalAnalysesFilter = ({ className }: GlobalAnalysesFilterProps) => {
  const globalFilter = useTableAnalysesStore((state) => state.globalFilter);
  const setGlobalFilter = useTableAnalysesStore((state) => state.setGlobalFilter);
  const setPagination = useTableAnalysesStore((state) => state.setPagination);
  const pagination = useTableAnalysesStore((state) => state.pagination);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
    if (e.target.value.length > 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  };

  return (
    <Input
      placeholder="Buscar análisis..."
      value={globalFilter ?? ""}
      onChange={handleChange}
      className={className}
    />
  );
};