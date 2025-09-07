"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisWorker = createRedisWorker;
const bullmq_1 = require("bullmq");
const timeline_1 = require("../layout-helpers/timeline");
function createRedisWorker() {
    const worker = new bullmq_1.Worker("ffmpeg-jobs", async (job) => {
        console.log(job.id);
        const roomId = job.data.roomId;
        console.log(`Starting FFmpeg process for room ${roomId}`);
        try {
            await (0, timeline_1.timeline)(roomId);
            console.log(`Finished processing room ${roomId}`);
        }
        catch (err) {
            console.error(`Error processing room ${roomId}:`, err);
            throw err;
        }
    }, {
        connection: { host: "localhost", port: 6379 },
        concurrency: 1,
    });
    worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
    worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
    worker.on("error", (err) => console.error("Worker error:", err));
    console.log("Worker is running and listening for jobs...");
}
