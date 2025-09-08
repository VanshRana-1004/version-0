import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY!,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET!,
});

export async function finalUploads(roomId : string){
    const finalRecordingDir=path.join(__dirname,'../../final-recordings');
    const finalRecordingFiles=fs.readdirSync(finalRecordingDir).filter(f=>f.startsWith(roomId));    
    for (const file of finalRecordingFiles) {
        try {
        const lastPart = file.split("_").pop();
        const clipNum = lastPart
            ? parseInt(lastPart.replace(".mp4", ""), 10)
            : NaN;

        const fullPath = path.join(finalRecordingDir, file);
        await uploadClip(fullPath, roomId, clipNum);

        console.log(`${file} uploaded successfully`);
        } catch (e) {
        console.error("Error while uploading", file, e);
        }
    }
}

async function uploadClip(filePath: string, roomId: string, clipNum: number) {
  let attempt = 0,retries = 3;
  while (attempt < retries) {
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          filePath,
          {
            resource_type: "video",
            folder: `recordings/${roomId}`,
            public_id: `clip_${clipNum}`,
            context: { roomId, clipNum: String(clipNum) },
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
    } catch (err) {
      attempt++;
      console.warn(`Upload failed (attempt ${attempt}) for clip ${clipNum}`, err);
      if (attempt >= retries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt)); // backoff
    }
  }
}
