import { spawn } from "child_process";

export function startFfmpeg(sdpPath: string, outputPath: string) {
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