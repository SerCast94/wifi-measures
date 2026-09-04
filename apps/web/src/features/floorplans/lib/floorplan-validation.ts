export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"];
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface FloorPlanValidationResult {
  ok: boolean;
  error?: string;
}

export const getFileExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
};

export const validateFloorPlanFile = (file: File): FloorPlanValidationResult => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: `El archivo supera el tamaño máximo permitido (${mb} MB).`,
    };
  }

  const extension = getFileExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      error:
        "Formato no compatible. Utiliza PNG, JPG/JPEG o PDF.",
    };
  }

  if (file.type && extension !== ".pdf") {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return {
        ok: false,
        error: `El tipo de contenido «${file.type}» no es compatible con la extensión «${extension}».`,
      };
    }
  }

  return { ok: true };
};

export const isPdfFile = (file: File | Pick<File, "name" | "type">): boolean => {
  return getFileExtension(file.name) === ".pdf" || file.type === "application/pdf";
};

export interface ImageDimensions {
  width: number;
  height: number;
}

/** Lee un archivo de imagen y devuelve sus dimensiones intrínsecas en píxeles. */
export const readImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
};

/** Lee un archivo como data URL (base64). */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
};

/** Genera un nombre seguro a partir del nombre del archivo original. */
export const sanitizeFileName = (fileName: string): string => {
  const base = fileName.replace(/\.(png|jpe?g|pdf)$/i, "");
  return (
    base
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .replace(/[\s_-]+/g, " ")
      .trim()
      .slice(0, 80) || "Plano"
  );
};

/**
 * Convierte la distancia en píxeles y un valor real a pixelsPerMeter.
 * Si unit es "cm" o "ft", primero convierte el valor real a metros.
 */
export const computePixelsPerMeter = (
  pixelDistance: number,
  realDistance: number,
  unit: "m" | "cm" | "ft"
): number => {
  if (pixelDistance <= 0 || realDistance <= 0) return 0;
  let meters = realDistance;
  if (unit === "cm") meters = realDistance / 100;
  if (unit === "ft") meters = realDistance * 0.3048;
  return pixelDistance / meters;
};

/** Convierte una distancia en píxeles a distancia real en la unidad solicitada. */
export const pixelsToReal = (
  pixels: number,
  pixelsPerMeter: number,
  unit: "m" | "cm" | "ft"
): number => {
  if (pixelsPerMeter <= 0) return 0;
  const meters = pixels / pixelsPerMeter;
  if (unit === "cm") return meters * 100;
  if (unit === "ft") return meters / 0.3048;
  return meters;
};

export const UNIT_LABELS: Record<"m" | "cm" | "ft", string> = {
  m: "metros (m)",
  cm: "centímetros (cm)",
  ft: "pies (ft)",
};
