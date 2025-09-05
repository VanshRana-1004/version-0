"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeline = timeline;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const layout_1 = require("./layout");
function waitUntilRecordingStopped(room) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            let peers = true;
            let screen = true;
            for (const proc of room.ffmpegProcesses.values()) {
                if (proc.exitCode === null) {
                    peers = false;
                    break;
                }
            }
            if (room.screenFFmpegProcess && room.screenFFmpegProcess.exitCode === null) {
                screen = false;
            }
            if (peers && screen) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}
function getDuration(filePath) {
    const out = (0, child_process_1.execSync)(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`).toString();
    return parseFloat(out);
}
function buildTimeline(clips) {
    const events = [];
    clips.forEach(c => {
        events.push(c.start, c.end);
    });
    const boundaries = Array.from(new Set(events)).sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
        const segStart = boundaries[i];
        const segEnd = boundaries[i + 1];
        const active = clips.filter(c => c.start <= segStart && c.end >= segEnd);
        if (active.length > 0) {
            segments.push({
                start: segStart,
                end: segEnd,
                active
            });
        }
    }
    return segments;
}
const finalClipsDir = path_1.default.join(__dirname, '../../final-recordings');
async function timeline(room) {
    const sdpDir = path_1.default.join(__dirname, '../../sdp');
    const sdpFiles = fs_1.default.readdirSync(sdpDir).filter(f => f.startsWith(room.roomId));
    if (sdpFiles.length === 0) {
        console.log(`[timeline] no recordings for room ${room.roomId}`);
        return;
    }
    await waitUntilRecordingStopped(room);
    console.log(`[timeline] all recordings for room ${room.roomId} have stopped and all ffmpeg processes have finished`);
    const recordingDir = path_1.default.join(__dirname, '../../recordings');
    const recordingFiles = fs_1.default.readdirSync(recordingDir).filter(f => f.startsWith(room.roomId));
    console.log(recordingFiles);
    const clips = recordingFiles.map(file => {
        const fullPath = path_1.default.join(recordingDir, file);
        const duration = getDuration(fullPath);
        const [roomId, ts, lastPart] = file.split("_");
        const timestamp = Number(ts);
        const base = lastPart.replace(/\..+$/, "");
        const type = (base === 'screen') ? base : 'peer';
        const start = parseInt(ts, 10);
        const end = start + duration * 1000;
        return { file: fullPath, start, end, type, duration };
    });
    console.log(clips);
    const finalTimeLine = buildTimeline(clips);
    console.log(finalTimeLine);
    for (const [ind, segment] of finalTimeLine.entries()) {
        const outputFile = `${room.roomId}_${ind}.mp4`;
        const outputPath = path_1.default.join(finalClipsDir, outputFile);
        await (0, layout_1.createLayout)(segment, outputPath);
    }
}
