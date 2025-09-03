"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordStream = recordStream;
const child_process_1 = require("child_process");
function recordStream(consumerInfo) {
    const { port, kind, codec } = consumerInfo;
    // Map codec to FFmpeg args
    const codecMap = {
        H264: ["-c:v", "copy"], // RTP -> H264 passthrough
        VP8: ["-c:v", "copy"],
        OPUS: ["-c:a", "copy"]
    };
    const outputFile = `recordings/${consumerInfo.peerId}-${consumerInfo.kind}.webm`;
    const args = [
        "-protocol_whitelist", "file,udp,rtp",
        "-i", `rtp://127.0.0.1:${port}`,
        ...(codecMap[codec] || []),
        "-f", "webm",
        outputFile
    ];
    const ffmpeg = (0, child_process_1.spawn)("ffmpeg", args);
    ffmpeg.stderr.on("data", (data) => {
        console.log(`[ffmpeg] ${data}`);
    });
    ffmpeg.on("close", (code) => {
        console.log(`FFmpeg exited with code ${code}`);
    });
    return ffmpeg;
}
