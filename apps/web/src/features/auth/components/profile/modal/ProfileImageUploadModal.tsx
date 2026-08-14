import { useState, useRef } from "react";

import { Upload, X } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/atomic-components/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/atomic-components/dialog";
import { Button } from "@/core/atomic-components/button";

interface ProfileImageUploadModalProps {
  currentImage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageChange: (image: string) => void;
}

export function ProfileImageUploadModal({
  currentImage,
  open,
  onOpenChange,
  onImageChange,
}: ProfileImageUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSave = () => {
    if (preview) {
      onImageChange(preview);
      onOpenChange(false);
      setPreview(null);
    }
  };

  const handleReset = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar imagen de perfil</DialogTitle>
          <DialogDescription>
            Sube una nueva imagen de perfil. Puedes arrastrar y soltar la imagen
            o hacer click para seleccionarla.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div
            className={`
              relative rounded-lg border-2 border-dashed p-6 transition-colors
              ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileChange(e.target.files[0])
              }
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={preview || currentImage} />
                <AvatarFallback>
                  <Upload className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              {preview ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="z-10"
                  onClick={handleReset}
                >
                  <X className="w-4 h-4" />
                  Eliminar
                </Button>
              ) : (
                <div className="text-sm text-center text-muted-foreground">
                  <p>Arrastra y suelta una imagen o</p>
                  <p>haz click para seleccionar</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!preview}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
