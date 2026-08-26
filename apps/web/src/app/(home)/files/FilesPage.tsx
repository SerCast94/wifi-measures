import { PaperclipIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/atomic-components/card";
import CustomLoading from "@/core/components/CustomLoading";
import { UnitFiles } from "@/features/netally/components/units/UnitFiles";
import { useUnits } from "@/features/netally/hooks/use-units";

const FilesPage = () => {
  const { data: units, isLoading } = useUnits();

  if (isLoading) return <CustomLoading />;

  const unitsWithFiles = (units ?? []).filter(
    (unit) => (unit.files?.length ?? 0) > 0
  );

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <h1 className="flex gap-4 px-2 mb-6 text-lg font-bold sm:items-center sm:text-2xl">
        <PaperclipIcon className="w-6 h-6" />
        Archivos de Link-Live
      </h1>

      {unitsWithFiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Las unidades NetAlly todavía no tienen archivos subidos a Link-Live.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unitsWithFiles.map((unit) => (
            <Card key={unit.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {unit.name ?? unit.id}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {unit.files.length} archivo(s)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UnitFiles files={unit.files} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilesPage;
