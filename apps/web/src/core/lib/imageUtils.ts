// Función para convertir Base64 a ArrayBuffer
export const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64.split(",")[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const rotateBase64Image = async (base64: string) => {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Ajustar dimensiones del canvas
      canvas.width = img.height;
      canvas.height = img.width;

      // Rotar 90 grados en sentido horario
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Convertir canvas a base64
      resolve(canvas.toDataURL());
    };
  });
};

export const base64ToBlob = (imageBase64: string) => {
  // Extraer el formato de la imagen (MIME type)
  const mimeType = imageBase64.match(/^data:(.*?);base64,/)?.[1] || "image/png";

  // Extraer solo la parte de los datos base64
  const base64Data = imageBase64.split(",")[1];

  if (!base64Data) {
    console.error("Base64 string inválida");
    return;
  }

  // Convertir Base64 a binario
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  // Crear Blob
  const blob = new Blob(byteArrays, { type: mimeType });

  return blob;
};
