"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.pipeline = null;
        this.consumersInfo = [];
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
    async startRecording() {
        if (this.consumersInfo.length === 0) {
            console.warn("No RTP streams to record yet");
            return;
        }
        // this.pipeline = new GStreamerRecorder(this.consumersInfo);
        // if (!this.pipeline) {
        //     console.warn("No pipeline ready for recording");
        //     return;
        // }
        // const filePath = this.pipeline.start();
        // console.log(`Recording started at ${filePath}`);
        // startGStreamerPipeline(this.consumersInfo);
    }
    async stopRecording() {
        // if (!this.pipeline) {
        //     console.warn("No pipeline to stop");
        //     return;
        // }
        // const result = await this.pipeline.stop();
        // console.log(result);
        // this.pipeline = null;
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
        if (!peer.audioPort) {
            peer.audioPlainTransport = await this.getPlainTransport();
            const audioPort = __1.rtpPortPool.acquirePort();
            console.log('audio port connected to plain transport: ', audioPort);
            peer.audioPort = audioPort;
            if (peer.audioPlainTransport && peer.producers.mic) {
                const audioConsumer = await peer.audioPlainTransport.consume({
                    producerId: peer.producers.mic.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.audioConsumer = audioConsumer;
                await peer.audioConsumer.resume();
                await peer.audioPlainTransport.connect({ ip: "127.0.0.1", port: audioPort });
                console.log("PlainTransport tuple:", peer.audioPlainTransport.tuple);
                console.log('for audio done');
                console.log("audio PlainTransport params:", {
                    ip: peer.audioPlainTransport?.tuple.localIp,
                    port: peer.audioPlainTransport?.tuple.localPort,
                    rtcpPort: peer.audioPlainTransport?.rtcpTuple?.localPort,
                });
            }
        }
        if (!peer.videoPort) {
            peer.videoPlainTransport = await this.getPlainTransport();
            const videoPort = __1.rtpPortPool.acquirePort();
            console.log('video port connected to plain transport: ', videoPort);
            peer.videoPort = videoPort;
            if (peer.videoPlainTransport && peer.producers.cam) {
                const videoConsumer = await peer.videoPlainTransport.consume({
                    producerId: peer.producers.cam.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.videoConsumer = videoConsumer;
                await peer.videoConsumer.resume();
                await peer.videoPlainTransport.connect({ ip: "127.0.0.1", port: videoPort });
                console.log("PlainTransport tuple:", peer.videoPlainTransport.tuple);
                console.log('for video done');
                console.log("video PlainTransport params:", {
                    ip: peer.videoPlainTransport?.tuple.localIp,
                    port: peer.videoPlainTransport?.tuple.localPort,
                    rtcpPort: peer.videoPlainTransport?.rtcpTuple?.localPort,
                });
            }
        }
    }
    // when newly joined peer is getting prepared for recording
    async createPlainTransportsForPeer(peer) {
        await this.getPeerReadyForRecording(peer);
        await this.getRtpStreamsInfoforPeer(peer);
        console.log("------ RTP STREAMS INFO when new peer joined ------");
        console.table(this.consumersInfo);
    }
    // when already present peers are getting prepared for recording  
    async createPlainTransports() {
        for (const peer of this.peers) {
            console.log(peer.socketId);
            await this.getPeerReadyForRecording(peer);
            console.log('----------------------creating consumers-----------------------');
        }
        await this.getRtpStreamsInfo();
        await this.startRecording();
    }
    async getRtpStreamsInfoforPeer(peer) {
        // if(peer.audioPlainTransport && peer.audioConsumer){
        //     const rtp=peer.audioConsumer?.rtpParameters;
        //     const codec=rtp?.codecs[0];
        //     this.consumersInfo.push({
        //         peerId:peer.userId,
        //         consumerId:peer.audioConsumer.id,
        //         kind:'audio',
        //         codec:codec.mimeType,
        //         payloadType:codec.payloadType,
        //         clockRate:codec.clockRate,
        //         ssrc:(rtp.encodings)?rtp.encodings[0].ssrc!:0,
        //         port:peer.audioPort!,
        //         profileLevelId: typeof codec?.parameters?.["profile-level-id"] === "string" ? codec.parameters["profile-level-id"] : 'N/A'
        //     })
        //     console.log('consumerId : ',peer.audioConsumer.id,' audioPort : ',peer.audioPort);
        // }
        if (peer.videoPlainTransport && peer.videoConsumer) {
            const rtp = peer.videoConsumer?.rtpParameters;
            const codec = rtp?.codecs[0];
            this.consumersInfo.push({
                peerId: peer.userId,
                consumerId: peer.videoConsumer.id,
                kind: 'video',
                codec: codec.mimeType,
                payloadType: codec.payloadType,
                clockRate: codec.clockRate,
                ssrc: (rtp.encodings) ? rtp.encodings[0].ssrc : 0,
                port: peer.videoPort,
                profileLevelId: typeof codec?.parameters?.["profile-level-id"] === "string" ? codec.parameters["profile-level-id"] : 'N/A'
            });
            console.log("RTP Parameters:", JSON.stringify(peer.videoConsumer?.rtpParameters, null, 2));
            console.log('consumerId : ', peer.videoConsumer.id, ' videoPort : ', peer.videoPort);
        }
    }
    async getRtpStreamsInfo() {
        for (const peer of this.peers) {
            await this.getRtpStreamsInfoforPeer(peer);
        }
        console.log("------ RTP STREAMS INFO for the present peers ------");
        console.table(this.consumersInfo);
    }
    async closePlainTransports() {
        await this.stopRecording();
        for (const peer of this.peers) {
            peer.videoPlainTransport?.close();
            peer.audioPlainTransport?.close();
            peer.videoConsumer?.close();
            peer.audioConsumer?.close();
            __1.rtpPortPool.releasePort(peer.audioPort);
            peer.audioPort = null;
            __1.rtpPortPool.releasePort(peer.videoPort);
            peer.videoPort = null;
        }
        console.log('closing recording');
    }
}
exports.default = Room;
//gst-launch-1.0 -v udpsrc port=42003 caps="application/x-rtp, media=video, encoding-name=H264, payload=101, clock-rate=90000" ! rtpjitterbuffer ! rtph264depay ! h264parse config-interval=1 ! mp4mux ! filesink location="output.mp4"
//gst-launch-1.0 -v -e udpsrc port=42003 caps="application/x-rtp,media=video,encoding-name=H264,payload=101,clock-rate=90000" ! queue leaky=downstream ! rtph264depay ! h264parse ! mp4mux ! filesink location="recording.mp4"
