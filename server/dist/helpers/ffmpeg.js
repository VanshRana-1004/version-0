"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFfmpeg = startFfmpeg;
const child_process_1 = require("child_process");
function startFfmpeg(sdpPath, outputPath) {
    const ffmpegArgs = [
        "-protocol_whitelist", "file,udp,rtp",
        "-i", sdpPath,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-g", "60",
        "-c:a", "aac",
        "-b:a", "160k",
        "-movflags", "+faststart",
        "-fflags", "+genpts",
        outputPath
    ];
    const ffmpeg = (0, child_process_1.spawn)("ffmpeg", ffmpegArgs);
    ffmpeg.stdout.on("data", (data) => {
        // console.log(`FFmpeg stdout: ${data}`);
    });
    ffmpeg.stderr.on("data", (data) => {
        // console.error(`FFmpeg stderr: ${data}`);
    });
    ffmpeg.on("close", (code) => {
        // console.log(`FFmpeg exited with code ${code}`);
    });
    return ffmpeg;
}
