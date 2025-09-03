"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordStream = recordStream;
const child_process_1 = require("child_process");
function recordStream(consumer, outputPath) {
    const input = `rtp://127.0.0.1:${consumer.port}?localrtpport=${consumer.port}&localrtcpport=${consumer.port + 1}&pkt_size=1200`;
    // choose container based on codec
    const container = consumer.codec.includes("H264") ? "mp4" : "webm";
    const args = [
        "-protocol_whitelist", "file,udp,rtp",
        "-i", input,
        "-c", "copy",
        "-map", "0",
        "-f", container,
        outputPath
    ];
    console.log("Spawning ffmpeg with args:", args.join(" "));
    const ffmpeg = (0, child_process_1.spawn)("ffmpeg", args);
    ffmpeg.stdout.on("data", (data) => {
        console.log(`FFmpeg stdout: ${data}`);
    });
    ffmpeg.stderr.on("data", (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });
    ffmpeg.on("close", (code) => {
        console.log(`FFmpeg exited with code ${code}`);
    });
    return ffmpeg;
}
