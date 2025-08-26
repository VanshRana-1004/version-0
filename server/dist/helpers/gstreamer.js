"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGStreamerPipeline = buildGStreamerPipeline;
exports.startGStreamer = startGStreamer;
const child_process_1 = require("child_process");
function buildGStreamerPipeline(consumersInfo, outputFile) {
    const gstParts = [];
    let videoIndex = 0;
    let audioIndex = 0;
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
            gstParts.push(`udpsrc port=${info.port} caps="application/x-rtp, media=video, encoding-name=${encoding.toUpperCase()}, payload=${info.payloadType}, clock-rate=${info.clockRate}, ssrc=${info.ssrc}" ` +
                `! ${depay} ! ${dec} ! videoconvert ! videoscale ! comp.sink_${videoIndex}`);
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
            gstParts.push(`udpsrc port=${info.port} caps="application/x-rtp, media=audio, encoding-name=${encoding.toUpperCase()}, payload=${info.payloadType}, clock-rate=${info.clockRate}, ssrc=${info.ssrc}" ` +
                `! ${depay} ! ${dec} ! audioconvert ! audioresample ! amix.`);
            audioIndex++;
        }
    }
    const basePipeline = `compositor name=comp sink_0::xpos=0 sink_0::ypos=0 ! videoconvert ! x264enc ! mp4mux name=mux ! filesink location=${outputFile} ` +
        `audiomixer name=amix ! audioconvert ! voaacenc ! mux.`;
    return gstParts.join(" ") + " " + basePipeline;
}
function startGStreamer(consumersInfo, outputFile) {
    const gstCmd = buildGStreamerPipeline(consumersInfo, outputFile);
    console.log("Launching GStreamer:", gstCmd);
    return (0, child_process_1.spawn)("gst-launch-1.0", gstCmd.split(" "), { stdio: "inherit", shell: true });
}
