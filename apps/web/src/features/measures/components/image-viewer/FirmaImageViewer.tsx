import { FileImage } from "lucide-react";

import { cn } from "@/core/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/core/atomic-components/dialog";
import { ImageViewerLoader } from "./ImageViewerLoader";
import { useMeasureImages } from "../../hooks/use-measure-images";

interface FirmaImageViewerProps {
  measureId: string;
  alt: string;
  description?: string;
  className?: string;
}

const FirmaImageViewer = ({
  measureId,
  alt,
  description,
  className,
}: FirmaImageViewerProps) => {
  const { firmaImage, isLoading, isError } = useMeasureImages(measureId);

  if (isError) return <p>Error al cargar imagen</p>;

  return (
    <>
      {firmaImage || isLoading ? (
        <Dialog>
          <DialogTrigger asChild>
            <div
              className={cn(
                `relative cursor-pointer rounded-md overflow-hidden border`,
                className
              )}
            >
              {firmaImage ? (
                <img
                  src={firmaImage}
                  alt={alt}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/5 hover:bg-black/10">
                  <FileImage className="w-6 h-6 text-primary" />
                </div>
              )}
              {isLoading && <ImageViewerLoader pendingMessage={""} />}
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogTitle>{alt}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <div className="relative w-full overflow-hidden rounded-md aspect-video">
              {firmaImage && (
                <img
                  src={firmaImage}
                  alt={alt}
                  className="object-contain w-full h-full"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div>No hay imagen disponible</div>
      )}
    </>
  );
};

export default FirmaImageViewer;
