import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useTableHostsStore } from "../../store/table-hosts.store";

interface HostsBandFilterProps {
  options: string[];
  className?: string;
}

export const HostsBandFilter = ({ options, className }: HostsBandFilterProps) => {
  const bandFilter = useTableHostsStore((state) => state.bandFilter);
  const setBandFilter = useTableHostsStore((state) => state.setBandFilter);
  const setPagination = useTableHostsStore((state) => state.setPagination);
  const pagination = useTableHostsStore((state) => state.pagination);

  if (options.length === 0) return null;

  const handleChange = (value: string) => {
    setBandFilter(value);
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  return (
    <Select value={bandFilter} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Banda" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las bandas</SelectItem>
        {options.map((band) => (
          <SelectItem key={band} value={band}>
            {band}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};