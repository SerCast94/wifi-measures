import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";

interface PageSizeSelectorProps {
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  options: number[];
}

export const PageSizeSelector = ({
  pageSize,
  setPageSize,
  options,
}: PageSizeSelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Select
        value={String(pageSize)}
        onValueChange={(value) => setPageSize(Number(value))}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder={`${pageSize}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
