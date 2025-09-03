"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const create_sdp_1 = require("../helpers/create-sdp");
const ffmpeg_1 = require("../helpers/ffmpeg");
const __1 = require("..");
class Room {
    constructor(roomId, router, userId) {
        this.orgHost = userId;
        this.host = userId;
        this.roomId = roomId;
        this.router = router;
        this.peers = [];
        this.screen = '';
        this.recording = 0;
        this.ffmpegProcesses = new Map();
    }
    getProducers() {
        const producersInfo = [];
        this.peers.forEach(peer => {
            let producer = peer.producers.cam;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer = peer.producers.mic;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer = peer.producers.screen;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer = peer.producers.saudio;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
        });
        console.log('-----Producers Info-----', producersInfo);
        return producersInfo;
    }
    getTransportById(transportId) {
        const peer = this.peers.find(p => p.downTransport?.id == transportId || p.upTransport?.id == transportId);
        if (peer) {
            return (peer.downTransport?.id == transportId) ? peer.downTransport : peer.upTransport;
        }
        return null;
    }
    getConsumerById(consumerId) {
        const peer = this.peers.find(p => p.consumers.find(c => c.id === consumerId));
        if (peer) {
            return peer.consumers.find(c => c.id === consumerId);
        }
        return null;
    }
    async startRecording(peer) {
        const sdpDir = path_1.default.join(__dirname, '../../sdp');
        if (!fs_1.default.existsSync(sdpDir)) {
            fs_1.default.mkdirSync(sdpDir, { recursive: true });
            console.log("Created recordings directory:", sdpDir);
        }
        const recordingDir = path_1.default.join(__dirname, '../../recordings');
        if (!fs_1.default.existsSync(recordingDir)) {
            fs_1.default.mkdirSync(recordingDir, { recursive: true });
            console.log("Created recordings directory:", recordingDir);
        }
        const sdpFileName = `${this.roomId}_${peer.socketId}.sdp`;
        const sdpPath = path_1.default.join(sdpDir, sdpFileName);
        (0, create_sdp_1.createSdpFile)(peer, sdpPath);
        const outputFileName = `${this.roomId}_${peer.socketId}.mp4`;
        const outputPath = path_1.default.join(recordingDir, outputFileName);
        this.recording = 1;
        const ffmpegProc = (0, ffmpeg_1.startFfmpeg)(sdpPath, outputPath);
        peer.ffmpegProcess = ffmpegProc;
        this.ffmpegProcesses.set(peer.socketId, ffmpegProc);
        console.log('Recording started for peer : ', peer.socketId);
    }
    async stopRecording(peer) {
        const proc = this.ffmpegProcesses.get(peer.socketId);
        if (proc) {
            proc.stdin.write("q");
            proc.stdin.end();
            this.ffmpegProcesses.delete(peer.socketId);
            console.log(`FFmpeg stopped for peer ${peer.socketId}`);
        }
    }
    async getPlainTransport() {
        if (!this.router)
            return null;
        const transport = await this.router.createPlainTransport({
            listenIp: { ip: '0.0.0.0', announcedIp: process.env.ANNOUNCED_IP },
            rtcpMux: true,
            comedia: false,
        });
        return transport;
    }
    async getPeerReadyForRecording(peer) {
        if (!this.router)
            return;
        if (!peer.audioPlainTransport) {
            peer.audioPlainTransport = await this.getPlainTransport();
            if (peer.audioPlainTransport && peer.producers.mic) {
                const audioConsumer = await peer.audioPlainTransport.consume({
                    producerId: peer.producers.mic.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.audioConsumer = audioConsumer;
                const audioPort = __1.rtpPool.acquirePort();
                await peer.audioPlainTransport.connect({ ip: '127.0.0.1', port: audioPort });
                peer.audioPort = audioPort;
                console.log('audio consumer codecs info : ', audioConsumer.rtpParameters.codecs);
            }
            console.log('audio port : ', peer.audioPlainTransport?.tuple.localPort);
        }
        if (!peer.videoPlainTransport) {
            peer.videoPlainTransport = await this.getPlainTransport();
            if (peer.videoPlainTransport && peer.producers.cam) {
                const videoConsumer = await peer.videoPlainTransport.consume({
                    producerId: peer.producers.cam.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.videoConsumer = videoConsumer;
                const videoPort = __1.rtpPool.acquirePort();
                await peer.videoPlainTransport.connect({ ip: '127.0.0.1', port: videoPort });
                peer.videoPort = videoPort;
                await peer.videoConsumer.requestKeyFrame();
                setInterval(async () => {
                    if (peer.videoConsumer && peer.videoConsumer.paused)
                        return;
                    if (peer.videoConsumer && !peer.videoConsumer.closed) {
                        await peer.videoConsumer.requestKeyFrame();
                    }
                }, 5000);
                console.log('video consumer codecs info : ', videoConsumer.rtpParameters.codecs);
            }
            console.log('video port : ', peer.videoPlainTransport?.tuple.localPort);
        }
    }
    // when newly joined peer is getting prepared for recording
    async createPlainTransportsForPeer(peer) {
        await this.getPeerReadyForRecording(peer);
        await this.startRecording(peer);
    }
    // when already present peers are getting prepared for recording  
    async createPlainTransports() {
        for (const peer of this.peers) {
            console.log(peer.socketId);
            await this.getPeerReadyForRecording(peer);
            await this.startRecording(peer);
        }
    }
    // stop recording for all the peers
    async closePlainTransports() {
        for (const peer of this.peers) {
            await this.stopRecording(peer);
            peer.videoPlainTransport?.close();
            peer.audioPlainTransport?.close();
            peer.videoConsumer?.close();
            peer.audioConsumer?.close();
            if (peer.videoPort)
                __1.rtpPool.releasePort(peer.videoPort);
            if (peer.audioPort)
                __1.rtpPool.releasePort(peer.audioPort);
            peer.videoPort = null;
            peer.audioPort = null;
            peer.videoConsumer = null;
            peer.audioConsumer = null;
            peer.videoPlainTransport = null;
            peer.audioPlainTransport = null;
        }
        this.recording = -1;
        console.log('closing recording');
    }
}
exports.default = Room;
