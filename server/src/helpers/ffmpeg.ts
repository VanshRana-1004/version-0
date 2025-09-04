import { spawn } from "child_process";

export function startFfmpeg(sdpPath: string, outputPath: string) {
  const ffmpegArgs = [
    "-protocol_whitelist", "file,udp,rtp",
    "-i", sdpPath,
    "-c:v", "copy",
    "-preset", "slow",
    "-crf", "20",
    "-g", "60",
    "-keyint_min", "60",
    "-c:a", "aac",
    "-b:a", "160k",
    "-movflags", "+faststart",
    outputPath
  ];

  const ffmpeg = spawn("ffmpeg", ffmpegArgs);

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