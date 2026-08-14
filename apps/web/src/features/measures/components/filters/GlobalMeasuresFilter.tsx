import { Input } from "@/core/atomic-components/input";
import { useTableMeasuresStore } from "../../store/table-measures.store";

interface GlobalMeasuresFilterProps {
  className?: string;
}

export const GlobalMeasuresFilter = ({
  className,
}: GlobalMeasuresFilterProps) => {
  const globalFilter = useTableMeasuresStore((state) => state.globalFilter);
  const setGlobalFilter = useTableMeasuresStore(
    (state) => state.setGlobalFilter
  );
  const setPagination = useTableMeasuresStore((state) => state.setPagination);
  const pagination = useTableMeasuresStore((state) => state.pagination);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
    if (e.target.value.length > 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  };

  return (
    <Input
      placeholder="Buscar medidas..."
      value={globalFilter ?? ""}
      onChange={handleChange}
      className={className}
    />
  );
};
