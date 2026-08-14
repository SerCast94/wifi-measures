import { FileImage } from "lucide-react";

import { cn } from "@/core/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/core/atomic-components/card";
import type { MeasureModel } from "@/features/measures/models/measure.model";
import { useMeasureImages } from "@/features/measures/hooks/use-measure-images";
import MeasureImageViewer from "@/features/measures/components/image-viewer/AntenaImageViewer";
import ChannelImagesViewer from "@/features/measures/components/image-viewer/ChannelmagesViewer";
import { ImageViewerLoader } from "@/features/measures/components/image-viewer/ImageViewerLoader";

interface ImagesTabProps {
  measure: MeasureModel;
}

export const ImagesTab = ({ measure }: ImagesTabProps) => {
  const { images, isLoading } = useMeasureImages(`${measure.id}`);

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
          Todas las imágenes adjuntas a esta medición
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("relative", !images && "min-h-[400px]")}>
        {isLoading && (
          <ImageViewerLoader pendingMessage={"Cargando imágenes"} />
        )}
        {images && images.images.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">Foto Antena</p>
                <MeasureImageViewer
                  measureId={`${measure.id}`}
                  alt="Foto Antena"
                  className="w-full aspect-video"
                />
              </div>
              {measure.channels &&
                Object.entries(measure.channels).map(
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  ([key, _channel], index) => (
                    <ChannelImagesViewer
                      key={key}
                      measureId={`${measure.id}`}
                      channel={
                        `c${index + 1}` as
                          | "c1"
                          | "c2"
                          | "c3"
                          | "c4"
                          | "c5"
                          | "c6"
                          | "c7"
                          | "c8"
                      }
                      alt={`Foto del Canal ${index + 1}`}
                      className="w-full aspect-video"
                    />
                  )
                )}
            </div>
          </div>
        )}
        {images && images.images.length === 0 && (
          <div className="mt-4 text-sm text-gray-500">
            No hay imágenes disponibles para esta medición.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
