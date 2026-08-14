import { Input } from "@/core/atomic-components/input";
import { useTableAreasStore } from "../../store/table-areas.store";

interface GlobalMeasuresFilterProps {
  className?: string;
}

export const GlobalAreasFilter = ({ className }: GlobalMeasuresFilterProps) => {
  const globalFilter = useTableAreasStore((state) => state.globalFilter);
  const setGlobalFilter = useTableAreasStore((state) => state.setGlobalFilter);
  const setPagination = useTableAreasStore((state) => state.setPagination);
  const pagination = useTableAreasStore((state) => state.pagination);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
    if (e.target.value.length > 0) {
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  };

  return (
    <Input
      placeholder="Buscar áreas..."
      value={globalFilter ?? ""}
      onChange={handleChange}
      className={className}
    />
  );
};
