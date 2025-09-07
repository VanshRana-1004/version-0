"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ffmpegQueue = void 0;
exports.enqueueRoomJob = enqueueRoomJob;
const bullmq_1 = require("bullmq");
exports.ffmpegQueue = new bullmq_1.Queue("ffmpeg-jobs", {
    connection: { host: "localhost", port: 6379 }
});
async function enqueueRoomJob(roomId) {
    await exports.ffmpegQueue.add("final", { roomId });
    console.log('job pushed to queue');
}
