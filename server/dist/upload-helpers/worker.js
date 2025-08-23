"use strict";
// import { Worker } from "bullmq";
// import redisConfig from "./redis";
// import fs from "fs";
// import cloudinary from "./cloudinary";
// export function startWorker() {
//   const worker = new Worker(
//     "uploadQueue",
//     async (job) => {
//       const {
//         filePath,
//         originalName,
//         roomId,
//         userId,
//         chunkNumber,
//         timestamp,
//         duration,
//         type,
//       } = job.data;
//       try {
//         console.log(`🚀 Processing job ${job.id} for ${originalName}`);
//         const result = await cloudinary.uploader.upload(filePath, {
//           resource_type: "video",
//           public_id: `call_${roomId}/type_${type}/peer_${userId}/chunk_${chunkNumber}`,
//           context: {
//             roomId,
//             userId,
//             chunkNumber,
//             timestamp,
//             duration,
//             type,
//           },
//           tags: [`call_${roomId}`, `peer_${userId}`, type],
//         });
//         console.log(
//           `✅ Uploaded chunk ${chunkNumber} (type: ${type}) for room ${roomId}: ${result.secure_url}`
//         );
//         fs.unlinkSync(filePath);
//         return { url: result.secure_url };
//       } catch (err) {
//         console.error(`❌ Failed to upload job ${job.id}:`, err);
//         throw err;
//       }
//     },
//     { connection: redisConfig }
//   );
//   worker.on("completed", (job) => {
//     console.log(`🎉 Job ${job.id} completed successfully`);
//   });
//   worker.on("failed", (job, err) => {
//     console.error(`🔥 Job ${job?.id} failed:`, err);
//   });
//   console.log("⚡ Worker started");
// }
