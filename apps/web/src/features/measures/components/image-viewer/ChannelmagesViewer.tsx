import { useMemo } from "react";

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

interface ChannelImagesViewerProps {
  measureId: string;
  channel: "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7" | "c8";
  alt: string;
  description?: string;
  className?: string;
}

const ChannelImagesViewer = ({
  measureId,
  channel,
  alt,
  className,
}: ChannelImagesViewerProps) => {
  const { images: image, isLoading, isError } = useMeasureImages(measureId);

  const fotoChannel = useMemo(() => {
    return (
      image?.images.filter((img) => img.name.startsWith(`foto_${channel}`)) ||
      null
    );
  }, [image, channel]);

  if (isError) return <p>Error al cargar imagen</p>;

  if (!fotoChannel && !isLoading) return null;

  return (
    <>
      {fotoChannel &&
        fotoChannel.length > 0 &&
        fotoChannel.map((foto, index) => (
          <div key={index} className="flex flex-col space-y-2">
            <p className="text-sm font-medium">{`Foto Canal ${channel}`}</p>
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div
                  className={cn(
                    `relative cursor-pointer rounded-md overflow-hidden border`,
                    className
                  )}
                >
                  {foto.base64 ? (
                    <img
                      src={foto.base64}
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
                <DialogDescription></DialogDescription>
                <div className="relative w-full overflow-hidden rounded-md aspect-video">
                  {foto.base64 && (
                    <img
                      src={foto.base64}
                      alt={alt}
                      className="object-contain w-full h-full"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
    </>
  );
};

export default ChannelImagesViewer;
