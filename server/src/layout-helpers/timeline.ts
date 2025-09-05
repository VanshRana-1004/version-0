import { execSync } from "child_process";
import Room from "../classes/room";
import path from "path";
import fs from "fs";

function waitUntilRecordingStopped(room: Room): Promise<void> {
  return new Promise(resolve => {
    const interval=setInterval(()=>{
        let peers=true;
        let screen=true;
        for(const proc of room.ffmpegProcesses.values()){
            if(proc.exitCode===null){
                peers=false;
                break;
            }
        }
        if(room.screenFFmpegProcess && room.screenFFmpegProcess.exitCode===null){
            screen=false;
        }
        if(peers && screen){
            clearInterval(interval);
            resolve();
        }
    },1000)
  });
}

function getDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
  ).toString();
  return parseFloat(out);
}

export async function timeline(room : Room){
    const sdpDir=path.join(__dirname,'../../sdp');
    const sdpFiles = fs.readdirSync(sdpDir).filter(f => f.startsWith(room.roomId));
    if (sdpFiles.length === 0) {
        console.log(`[timeline] no recordings for room ${room.roomId}`);
        return;
    }

    await waitUntilRecordingStopped(room);
    
    console.log(`[timeline] all recordings for room ${room.roomId} have stopped and all ffmpeg processes have finished`);

    const recordingDir=path.join(__dirname,'../../recordings');
    const recordingFiles=fs.readdirSync(recordingDir).filter(f=>f.startsWith(room.roomId));

    console.log(recordingFiles);

    const clips = recordingFiles.map(file => {
        const fullPath = path.join(recordingDir, file);
        const duration = getDuration(fullPath);

        const [roomId, ts, lastPart] = file.split("_");
        const timestamp = Number(ts);
        const base = lastPart.replace(/\..+$/, ""); 

        const  type: "screen" | "peer"=(base==='screen')?base:'peer';

        const start = parseInt(ts, 10);
        const end = start + duration * 1000;

        return { file: fullPath, start, end, type, duration };
    });

    console.log(clips);

}