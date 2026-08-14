import { useRoles } from "../../providers/RolesProvider";
import { MultiSelect } from "@/core/atomic-components/multiselect";

interface RolesSelectorProps {
  onValueChange: (value: string[]) => void;
  values: string[];
  className?: string;
  error?: string;
  disabled?: boolean;
}

const RolesSelector = ({
  onValueChange,
  values,
  className,
  error,
  disabled = false,
}: RolesSelectorProps) => {
  const { roles } = useRoles();

  return (
    <>
      <MultiSelect
        className={className}
        placeholder="Seleccione rol/roles"
        values={values}
        options={roles.map((role) => ({ label: role.label, value: role.id }))}
        onValueChange={(value) => onValueChange(value)}
        disabled={disabled}
      />
      {error && (
        <p className="text-sm font-bold text-destructive">
          {error ||
            "Error al intentar agregar la tarea. Por favor, intenta de nuevo más tarde."}
        </p>
      )}
    </>
  );
};

export default RolesSelector;
