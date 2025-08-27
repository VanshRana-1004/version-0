"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGStreamerPipeline = buildGStreamerPipeline;
exports.startGStreamer = startGStreamer;
const child_process_1 = require("child_process");
function buildGStreamerPipeline(consumersInfo, outputFile) {
    const gstParts = [];
    let videoIndex = 0;
    let audioIndex = 0;
    // Video layout configuration (simple grid)
    const videoWidth = 320; // Width per video in the grid
    const videoHeight = 240; // Height per video in the grid
    const maxColumns = 2; // Number of videos per row in the grid
    for (const info of consumersInfo) {
        const [media, encoding] = info.codec.split("/");
        if (info.kind === "video") {
            let depay, dec;
            switch (encoding.toUpperCase()) {
                case "VP8":
                    depay = "rtpvp8depay";
                    dec = "vp8dec";
                    break;
                case "VP9":
                    depay = "rtpvp9depay";
                    dec = "vp9dec";
                    break;
                case "H264":
                    depay = "rtph264depay";
                    dec = "avdec_h264";
                    break;
                default:
                    throw new Error(`Unsupported video codec: ${encoding}`);
            }
            // Calculate position in grid
            const xpos = (videoIndex % maxColumns) * videoWidth;
            const ypos = Math.floor(videoIndex / maxColumns) * videoHeight;
            gstParts.push(`udpsrc port=${info.port} caps=application/x-rtp,media=video,encoding-name=${encoding.toUpperCase()},payload=${info.payloadType},clock-rate=${info.clockRate},ssrc=${info.ssrc} ` +
                `! ${depay} ! ${dec} ! videoconvert ! videoscale ! video/x-raw,width=${videoWidth},height=${videoHeight} ` +
                `! queue ! compositor.sink_${videoIndex}:xpos=${xpos}:ypos=${ypos}`);
            videoIndex++;
        }
        else if (info.kind === "audio") {
            let depay, dec;
            switch (encoding.toUpperCase()) {
                case "OPUS":
                    depay = "rtpopusdepay";
                    dec = "opusdec";
                    break;
                case "PCMU":
                    depay = "rtppcmudepay";
                    dec = "mulawdec";
                    break;
                case "PCMA":
                    depay = "rtppcmadepay";
                    dec = "alawdec";
                    break;
                default:
                    throw new Error(`Unsupported audio codec: ${encoding}`);
            }
            gstParts.push(`udpsrc port=${info.port} caps=application/x-rtp,media=audio,encoding-name=${encoding.toUpperCase()},payload=${info.payloadType},clock-rate=${info.clockRate},ssrc=${info.ssrc} ` +
                `! ${depay} ! ${dec} ! audioconvert ! audioresample ! queue ! audiomixer.sink_${audioIndex}`);
            audioIndex++;
        }
    }
    // Base pipeline with compositor and audiomixer
    const basePipeline = `compositor name=comp ! videoconvert ! x264enc tune=zerolatency ! mp4mux name=mux streamable=true ! filesink location=${outputFile} ` +
        `audiomixer name=amix ! audioconvert ! voaacenc ! mux.`;
    // Combine all parts, ensuring each branch is a separate pipeline
    return gstParts.join(" ") + " " + basePipeline;
}
function startGStreamer(consumersInfo, outputFile) {
    const gstCmd = buildGStreamerPipeline(consumersInfo, outputFile);
    console.log("Launching GStreamer:", gstCmd);
    // Split the pipeline into arguments for gst-launch-1.0
    const args = ["--gst-debug-level=3"].concat(gstCmd.split(/\s+/));
    const process = (0, child_process_1.spawn)("gst-launch-1.0", args, { stdio: ["inherit", "inherit", "pipe"] });
    // Log GStreamer errors
    process.stderr.on("data", (data) => {
        console.error(`GStreamer Error: ${data.toString()}`);
    });
    process.on("exit", (code) => {
        console.log(`GStreamer process exited with code ${code}`);
    });
    return process;
}
