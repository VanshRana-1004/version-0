"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGStreamerPipeline = startGStreamerPipeline;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
function startGStreamerPipeline(consumerInfo) {
    let depay;
    let mux;
    let extension;
    const consumer = consumerInfo[0];
    switch (consumer.codec.toLowerCase()) {
        case "video/vp8":
            depay = "rtpvp8depay";
            mux = "webmmux";
            extension = "webm";
            break;
        case "video/vp9":
            depay = "rtpvp9depay";
            mux = "webmmux";
            extension = "webm";
            break;
        case "video/h264":
            depay = "rtph264depay";
            mux = "mp4mux";
            extension = "mp4";
            break;
        default:
            throw new Error(`Unsupported codec: ${consumer.codec}`);
    }
    const location = path_1.default.join("recordings", `${consumer.peerId}-${consumer.consumerId}.${extension}`);
    const encodingName = consumer.codec.split('/')[1].toUpperCase();
    const caps = `application/x-rtp,media=video,encoding-name=${encodingName},payload=${consumer.payloadType},clock-rate=${consumer.clockRate}`;
    const args = ["-e", "udpsrc", `port=${consumer.port}`, `caps=${caps}`, "!", "queue", "leaky=downstream", "!", depay, "!", "h264parse", "!", mux, "!", "filesink", `location=${location}`];
    console.log("Starting GStreamer pipeline:", args.join(" "));
    const gst = (0, child_process_1.spawn)("gst-launch-1.0", args, {
        env: { ...process.env, GST_DEBUG: "3" }
    });
    gst.stderr.on("data", (data) => {
        console.error(`[GStreamer:${consumer.peerId}] ${data}`);
    });
    gst.on("close", (code) => {
        console.log(`[GStreamer:${consumer.peerId}] exited with code ${code}`);
    });
    return gst;
}
