import { FileImage } from "lucide-react";

import { cn } from "@/core/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/core/atomic-components/card";
import type { Area } from "@/features/measures/types/areas.types";
import { useAreaImages } from "@/features/measures/hooks/use-area-images";
import { sortMeasureImages } from "@/features/measures/lib/measures.helper";
import { ImageViewerLoader } from "@/features/measures/components/image-viewer/ImageViewerLoader";

interface ImagesTabProps {
  area: Area;
}

export const ImagesTab = ({ area }: ImagesTabProps) => {
  const { images, isLoading } = useAreaImages(`${area.id}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileImage className="w-5 h-5 mr-2" />
            Galería de Imágenes
          </div>
        </CardTitle>
        <CardDescription>
          Todas las imágenes adjuntas a este área
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("relative", !images && "min-h-[400px]")}>
        {isLoading && (
          <ImageViewerLoader pendingMessage={"Cargando imágenes"} />
        )}
        {images &&
          images.length > 0 &&
          images.sort(sortMeasureImages).map((measureImages) => (
            <div key={measureImages.idFormulario} className="space-y-4">
              <span className="text-lg font-medium">
                P{measureImages.ptoMedida}M{measureImages.nMedida}
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {measureImages.images
                  .filter(({ name }) => name !== "firma")
                  .map((image) => (
                    <div className="mb-8 space-y-4" key={image.name}>
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium">Foto {image.name}</p>
                        {image.base64 && (
                          <img
                            src={image.base64}
                            alt={`Foto ${image.name}`}
                            className="object-cover w-full border aspect-video rounded-xl"
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        {images && images.length === 0 && (
          <div className="mt-4 text-sm text-gray-500">
            No hay imágenes disponibles para este área.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
