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
  console.log("Uploading file:", filePath, "size:", fs.statSync(filePath).size);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_chunked(
      filePath,
      {
        resource_type: "video",
        folder: `recordings/${roomId}`,
        public_id: `clip_${clipNum}`,
        chunk_size: 20_000_000,
        context: { roomId, clipNum: String(clipNum) },
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          reject(error);
        } else {
          console.log("Cloudinary result:", result);
          resolve(result);
        }
      }
    );
  });
}
