import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "./badge";

export const CheckStatusBadge = ({ value }: { value: boolean | null }) => {
  if (value === null) return <Badge variant="outline">No especificado</Badge>;

  return value ? (
    <Badge
      variant="success"
      className="text-green-800 bg-green-100 hover:bg-green-100"
    >
      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sí
    </Badge>
  ) : (
    <Badge
      variant="destructive"
      className="text-red-800 bg-red-100 hover:bg-red-100"
    >
      <XCircle className="w-3.5 h-3.5 mr-1" /> No
    </Badge>
  );
};
