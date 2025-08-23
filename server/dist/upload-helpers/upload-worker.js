"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = __importDefault(require("./cloudinary"));
const connection = new ioredis_1.default();
const worker = new bullmq_1.Worker("uploadQueue", async (job) => {
    const { filePath, originalName, roomId, userId, chunkNumber, timestamp, duration, type, } = job.data;
    try {
        console.log(`🚀 Processing job ${job.id} for ${originalName}`);
        const result = await cloudinary_1.default.uploader.upload(filePath, {
            resource_type: "video",
            public_id: `call_${roomId}/type_${type}/peer_${userId}/chunk_${chunkNumber}`,
            context: {
                roomId,
                userId,
                chunkNumber,
                timestamp,
                duration,
                type,
            },
            tags: [`call_${roomId}`, `peer_${userId}`, type],
        });
        console.log(`✅ Uploaded chunk ${chunkNumber} (type: ${type}) for room ${roomId}: ${result.secure_url}`);
        fs_1.default.unlinkSync(filePath);
        return { url: result.secure_url };
    }
    catch (err) {
        console.error(`❌ Failed to upload job ${job.id}:`, err);
        throw err;
    }
}, { connection });
worker.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed successfully`);
});
worker.on("failed", (job, err) => {
    console.error(`🔥 Job ${job?.id} failed:`, err);
});
