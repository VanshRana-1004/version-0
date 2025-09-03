"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    }
    async closeRecordingConsumers() {
        this.audioPlainTransport?.close();
        this.videoPlainTransport?.close();
        this.audioConsumer?.close();
        this.videoConsumer?.close();
        this.audioConsumer = null;
        this.videoConsumer = null;
    }
}
exports.default = Peer;
