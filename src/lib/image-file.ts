export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });
}

export async function prepareLeafImage(file: File, maxSize = 1600) {
  const dataUrl = await readFileAsDataUrl(file);
  return resizeImageDataUrl(dataUrl, maxSize);
}

export function resizeImageDataUrl(dataUrl: string, maxSize = 1600) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => reject(new Error("Could not open that photo."));
    image.src = dataUrl;
  });
}
