"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class Peer {
    constructor(name, socketId, userId) {
        this.userId = userId;
        this.name = name;
        this.socketId = socketId,
            this.producers = {
                cam: null,
                mic: null,
                screen: null,
                saudio: null
            },
            this.upTransport = null,
            this.downTransport = null,
            this.consumers = [],
            this.screen = false,
            this.videoConsumer = null;
        this.audioConsumer = null;
        this.videoPlainTransport = null;
        this.audioPlainTransport = null;
        this.audioPort = null;
        this.videoPort = null;
        this.ffmpegProcess = null;
    }
    async stopRecording() {
        if (this.ffmpegProcess) {
            this.ffmpegProcess.stdin.write("q");
            this.ffmpegProcess.stdin.end();
            this.ffmpegProcess = null;
            console.log(`FFmpeg stopped for peer ${this.socketId}`);
        }
    }
    async closeRecordingConsumers() {
        await this.stopRecording();
        this.audioPlainTransport?.close();
        this.videoPlainTransport?.close();
        this.audioConsumer?.close();
        this.videoConsumer?.close();
        if (this.videoPort)
            __1.rtpPool.releasePort(this.videoPort);
        if (this.audioPort)
            __1.rtpPool.releasePort(this.audioPort);
        this.videoPort = null;
        this.audioPort = null;
        this.videoConsumer = null;
        this.audioConsumer = null;
        this.videoPlainTransport = null;
        this.audioPlainTransport = null;
    }
}
exports.default = Peer;
