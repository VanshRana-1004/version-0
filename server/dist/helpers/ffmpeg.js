"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFfmpeg = startFfmpeg;
const child_process_1 = require("child_process");
function startFfmpeg(sdpPath, outputPath) {
    const ffmpegArgs = [
        "-protocol_whitelist", "file,udp,rtp",
        "-i", sdpPath,
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outputPath
    ];
    const ffmpeg = (0, child_process_1.spawn)("ffmpeg", ffmpegArgs);
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
