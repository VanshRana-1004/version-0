import { Router } from "mediasoup/node/lib/RouterTypes";
import Peer from "./peer";
import { AppData } from "mediasoup/node/lib/types";
import { ChildProcessWithoutNullStreams } from "child_process";
import { startGStreamer } from "../helpers/gstreamer";
import { rtpPortPool } from "..";

export interface ConsumerInfo{
    peerId: string;
    consumerId: string;
    kind: 'audio' | 'video';
    codec: string;
    payloadType: number;
    clockRate: number;
    ssrc: number;
    port: number;
}

class Room{
    public roomId : string;
    public router : Router | null;
    public peers : Peer[];
    public screen : string;
    public host : string;
    public orgHost : string; 
    public recording : number;
    public gstProcess: ChildProcessWithoutNullStreams | null;

    constructor(roomId : string, router : Router, userId : string){
        this.orgHost=userId; 
        this.host=userId;
        this.roomId=roomId;
        this.router=router;
        this.peers=[];
        this.screen='';
        this.recording=0;
        this.gstProcess=null
    }

    getProducers() {
        const producersInfo : {id : string, kind : 'video' | 'audio', appData : AppData }[]= [];
        this.peers.forEach(peer => {
            let producer = peer.producers.cam;
            if (producer) {
                producersInfo.push({
                    id: producer.id,
                    kind: producer.kind,
                    appData: producer.appData
                });
            }
            producer=peer.producers.mic;
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
            producer=peer.producers.saudio;
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

    getTransportById(transportId : string){
        const peer=this.peers.find(p=>p.downTransport?.id==transportId || p.upTransport?.id==transportId);
        if(peer){
            return (peer.downTransport?.id==transportId)?peer.downTransport:peer.upTransport;
        }
        return null
    }

    getConsumerById(consumerId : string){
        const peer=this.peers.find(p=>p.consumers.find(c=>c.id===consumerId));
        if(peer){
            return peer.consumers.find(c=>c.id===consumerId);
        }
        return null
    }

    async startRecording() {
        const consumersInfo = await this.getRtpStreamsInfo();
        if (consumersInfo.length === 0) {
            console.warn("No RTP streams to record yet");
            return;
        }
        this.gstProcess = startGStreamer(consumersInfo, `room-${this.roomId}.mp4`);
    }

    async stopRecording() {
        if (this.gstProcess) {
            this.gstProcess.kill("SIGINT");
            this.gstProcess = null;
            console.log("Stopped GStreamer recording");
        }
    }

    async getPlainTransport(){
        if(!this.router) return null;
        const transport=await this.router.createPlainTransport({
            listenIp:{ip:'0.0.0.0',announcedIp:process.env.ANNOUNCED_IP},
            rtcpMux:true,
            comedia:true
        })
        return transport;
    }

    async createPlainTransports(){
        if(!this.router) return;
        console.log('length : ', this.peers.length);
        for(const peer of this.peers){
            console.log(peer.socketId);
            if(!peer.audioPort){
                peer.audioPlainTransport=await this.getPlainTransport();
                const audioPort=rtpPortPool.acquirePort();
                await peer.audioPlainTransport?.connect({ ip: "127.0.0.1", port: audioPort });
                peer.audioPort=audioPort;
                if(peer.audioPlainTransport && peer.producers.mic){
                    const audioConsumer=await peer.audioPlainTransport.consume({
                        producerId: peer.producers.mic.id,
                        rtpCapabilities: this.router.rtpCapabilities,
                        paused: false
                    });
                    peer.audioConsumer=audioConsumer;
                    await peer.audioConsumer.resume();
                }
            }
            if(!peer.videoPort){
                peer.videoPlainTransport=await this.getPlainTransport();
                const videoPort=rtpPortPool.acquirePort();
                await peer.videoPlainTransport?.connect({ ip: "127.0.0.1", port: videoPort });
                peer.videoPort=videoPort;
                if(peer.videoPlainTransport && peer.producers.cam){
                    const videoConsumer=await peer.videoPlainTransport.consume({
                        producerId: peer.producers.cam.id,
                        rtpCapabilities: this.router.rtpCapabilities,
                        paused: false
                    });
                    peer.videoConsumer=videoConsumer;
                    await peer.videoConsumer.resume();
                }
            }
            console.log('----------------------creating consumers-----------------------')
        }
        await this.startRecording();
    }

    async getRtpStreamsInfo(){
        const consumersInfo: ConsumerInfo[] = [];
        for(const peer of this.peers){

            if(peer.audioPlainTransport && peer.audioConsumer){
                const rtp=peer.audioConsumer?.rtpParameters;
                const codec=rtp?.codecs[0];
                consumersInfo.push({
                    peerId:peer.userId,
                    consumerId:peer.audioConsumer.id,
                    kind:'audio',
                    codec:codec.mimeType,
                    payloadType:codec.payloadType,
                    clockRate:codec.clockRate,
                    ssrc:(rtp.encodings)?rtp.encodings[0].ssrc!:0,
                    port:peer.audioPort!
                })
                console.log('consumerId : ',peer.audioConsumer.id,' audioPort : ',peer.audioPort);
            }

            if(peer.videoPlainTransport && peer.videoConsumer){
                const rtp=peer.videoConsumer?.rtpParameters;
                const codec=rtp?.codecs[0];
                consumersInfo.push({
                    peerId:peer.userId,
                    consumerId:peer.videoConsumer.id,
                    kind:'video',
                    codec:codec.mimeType,
                    payloadType:codec.payloadType,
                    clockRate:codec.clockRate,
                    ssrc:(rtp.encodings)?rtp.encodings[0].ssrc!:0,
                    port:peer.videoPort!
                })
                console.log('consumerId : ',peer.videoConsumer.id,' videoPort : ',peer.videoPort);
            }
        }

        console.log("------ RTP STREAMS INFO ------");
        console.table(consumersInfo);

        return consumersInfo;
    }

    async closePlainTransports(){
        await this.stopRecording();
        for(const peer of this.peers){
            peer.videoPlainTransport?.close();
            peer.audioPlainTransport?.close();
            peer.videoConsumer?.close();
            peer.audioConsumer?.close();
            rtpPortPool.releasePort(peer.audioPort!);
            peer.audioPort=null;
            rtpPortPool.releasePort(peer.videoPort!);
            peer.videoPort=null;
        }
    }

}

export default Room;