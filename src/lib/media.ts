import { mkdir, writeFile } from "fs/promises";
import path from "path";

function canWritePublicFiles() {
  return process.env.VERCEL !== "1";
}

export async function persistDataImage(imageUrl: string | undefined, prefix: string) {
  if (!imageUrl?.startsWith("data:image")) return imageUrl;

  if (!canWritePublicFiles()) {
    return imageUrl;
  }

  try {
    const base64Data = imageUrl.split(",")[1];
    if (!base64Data) return imageUrl;
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    const publicDir = path.join(process.cwd(), "public", "cassava_image");
    await mkdir(publicDir, { recursive: true });
    await writeFile(path.join(publicDir, fileName), buffer);
    return `/cassava_image/${fileName}`;
  } catch (error) {
    console.error("Failed to save image to disk, keeping inlined image:", error);
    return imageUrl;
  }
}
