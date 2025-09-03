import { Router } from "mediasoup/node/lib/RouterTypes";
import Peer from "./peer";
import { AppData, Consumer, PlainTransport } from "mediasoup/node/lib/types";
import path from "path";
import { createSdpFile } from "../helpers/create-sdp";
import { startFfmpeg } from "../helpers/ffmpeg";
import { rtpPool } from "..";
import { ChildProcessWithoutNullStreams } from "child_process";

const sdpDir=path.join(__dirname,'../../sdp');
const recordingDir=path.join(__dirname,'../../recordings');

class Room{
    public roomId : string;
    public router : Router | null;
    public peers : Peer[];
    public screen : string;
    public host : string;
    public orgHost : string; 
    public recording : number;
    public ffmpegProcesses: Map<string, ChildProcessWithoutNullStreams>;
    
    public screenFFmpegProcess : ChildProcessWithoutNullStreams | null;
    public screenTransport : PlainTransport | null;
    public saudioTransport : PlainTransport | null;
    public screenConsumer : Consumer | null;
    public saudioConsumer : Consumer | null;
    public screenPort : number | null;
    public saudioPort : number | null;

    constructor(roomId : string, router : Router, userId : string){
        this.orgHost=userId; 
        this.host=userId;
        this.roomId=roomId;
        this.router=router;
        this.peers=[];
        this.screen='';
        this.recording=0;
        this.ffmpegProcesses=new Map();

        this.screenFFmpegProcess=null;
        this.screenTransport=null;
        this.saudioTransport=null;
        this.screenConsumer=null;
        this.saudioConsumer=null;
        this.screenPort=null;
        this.saudioPort=null;
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

    async startRecording(peer : Peer) {

        const sdpFileName=`${this.roomId}_${peer.socketId}.sdp`;
        const sdpPath=path.join(sdpDir,sdpFileName);
        if(!peer.audioConsumer || !peer.videoConsumer || !peer.audioPort || !peer.videoPort) return;

        createSdpFile(peer.audioConsumer,peer.videoConsumer,peer.audioPort,peer.videoPort,sdpPath);
        
        const outputFileName=`${this.roomId}_${peer.socketId}.mp4`;
        const outputPath=path.join(recordingDir,outputFileName);

        this.recording=1;
        const ffmpegProc=startFfmpeg(sdpPath,outputPath); 
        this.ffmpegProcesses.set(peer.socketId, ffmpegProc);
        console.log('Recording started for peer : ',peer.socketId);
    }

    async stopRecording(peer: Peer) {
        const proc = this.ffmpegProcesses.get(peer.socketId);
        if (proc) {
            proc.stdin.write("q"); 
            proc.stdin.end();
            this.ffmpegProcesses.delete(peer.socketId);
            console.log(`FFmpeg stopped for peer ${peer.socketId}`);
        }
        peer.videoPlainTransport?.close();
        peer.audioPlainTransport?.close();
        peer.videoConsumer?.close();
        peer.audioConsumer?.close();
        if(peer.videoPort) rtpPool.releasePort(peer.videoPort);
        if(peer.audioPort) rtpPool.releasePort(peer.audioPort);
        peer.videoPort=null;
        peer.audioPort=null;    
        peer.videoConsumer=null;
        peer.audioConsumer=null;
        peer.videoPlainTransport=null;
        peer.audioPlainTransport=null;
    }

    async getPlainTransport(){
        if(!this.router) return null;
        const transport=await this.router.createPlainTransport({
            listenIp:{ip:'0.0.0.0',announcedIp:process.env.ANNOUNCED_IP},
            rtcpMux:true,
            comedia:false,
        })
        return transport;
    }

    async getPeerReadyForRecording(peer : Peer){
        if(!this.router) return;
        if(!peer.audioPlainTransport){
            peer.audioPlainTransport=await this.getPlainTransport();
            if(peer.audioPlainTransport && peer.producers.mic){
                const audioConsumer=await peer.audioPlainTransport.consume({
                    producerId: peer.producers.mic.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.audioConsumer=audioConsumer;
                const audioPort=rtpPool.acquirePort();
                await peer.audioPlainTransport.connect({ip:'127.0.0.1',port:audioPort})
                peer.audioPort=audioPort;
                console.log('audio consumer codecs info : ',audioConsumer.rtpParameters.codecs);
            }
            console.log('audio port : ',peer.audioPlainTransport?.tuple.localPort);
        }
        if(!peer.videoPlainTransport){
            peer.videoPlainTransport=await this.getPlainTransport();
            if(peer.videoPlainTransport && peer.producers.cam){
                const videoConsumer=await peer.videoPlainTransport.consume({
                    producerId: peer.producers.cam.id,
                    rtpCapabilities: this.router.rtpCapabilities,
                    paused: false
                });
                peer.videoConsumer=videoConsumer;
                const videoPort=rtpPool.acquirePort();
                await peer.videoPlainTransport.connect({ip:'127.0.0.1',port:videoPort})
                peer.videoPort=videoPort;
                await peer.videoConsumer.requestKeyFrame();
                setInterval(async () => {
                    if (peer.videoConsumer && peer.videoConsumer.paused) return;
                    if (peer.videoConsumer && !peer.videoConsumer.closed) {
                        await peer.videoConsumer.requestKeyFrame();
                    }
                }, 5000);
                console.log('video consumer codecs info : ',videoConsumer.rtpParameters.codecs);
            }
            console.log('video port : ',peer.videoPlainTransport?.tuple.localPort);
        }
    }

    // when newly joined peer is getting prepared for recording
    async createPlainTransportsForPeer(peer : Peer){
        await this.getPeerReadyForRecording(peer);
        await this.startRecording(peer);
    }

    // when already present peers are getting prepared for recording  
    async createPlainTransports(){
        for (const peer of this.peers) {
            console.log('Preparing peer:', peer.socketId);
            await this.getPeerReadyForRecording(peer);
        }

        const startRecordingPromises = this.peers.map(peer => {
            return this.startRecording(peer);
        });

        await Promise.all(startRecordingPromises); 
        console.log('All recordings started concurrently');

    }

    // stop recording for all the peers
    async closePlainTransports(){
        for(const peer of this.peers){
            await this.stopRecording(peer);
        }
        this.recording=-1;
        console.log('closing recording');
    }

    // to prepare transport and consumer for shared screen for recording 
    async startSharedScreenRecording(peer : Peer){
        if(!this.router) return;
        
        if(!peer.producers.screen) console.log('No screen producer found for peer : ',peer.socketId);
        if(!peer.producers.saudio) console.log('No screen audio producer found for peer : ',peer.socketId);

        if(peer.producers.screen){
            const screenTransport=await this.getPlainTransport();
            if(!screenTransport) return;
            this.screenTransport=screenTransport;
            const screenConsumer=await screenTransport.consume({
                producerId:peer.producers.screen.id,
                rtpCapabilities:this.router.rtpCapabilities, 
                paused:false
            })
            this.screenConsumer=screenConsumer;
            const screenPort=rtpPool.acquirePort();
            this.screenPort=screenPort;
            await this.screenTransport.connect({ip:'127.0.0.1',port:screenPort})
            await this.screenConsumer.requestKeyFrame();
            setInterval(async () => {
                if (this.screenConsumer && this.screenConsumer.paused) return;
                if (this.screenConsumer && !this.screenConsumer.closed) {
                    await this.screenConsumer.requestKeyFrame();
                }
            }, 5000);
            console.log('screen consumer codecs info : ',screenConsumer.rtpParameters.codecs);
        }

        if(peer.producers.saudio){
            const saudioTransport=await this.getPlainTransport();
            if(!saudioTransport) return;
            this.saudioTransport=saudioTransport;
            const saudioConsumer=await saudioTransport.consume({
                producerId:peer.producers.saudio.id,
                rtpCapabilities:this.router.rtpCapabilities, 
                paused:false
            })
            this.saudioConsumer=saudioConsumer;
            const saudioPort=rtpPool.acquirePort();
            this.saudioPort=saudioPort;
            await this.saudioTransport.connect({ip:'127.0.0.1',port:saudioPort})
            console.log('screen audio consumer codecs info : ',saudioConsumer.rtpParameters.codecs);
        }

        this.startScreenFFmpegProcess();
    }

    // to actually start the FFmpeg process for recording screen
    async startScreenFFmpegProcess(){
        const sdpFileName=`${this.roomId}_screen.sdp`;
        const sdpPath=path.join(sdpDir,sdpFileName);
        const outputFileName=`${this.roomId}_screen.mp4`;
        const outputPath=path.join(recordingDir,outputFileName);
        if(!this.saudioConsumer || !this.screenConsumer || !this.saudioPort || !this.screenPort) return;
        console.log('Starting screen recording with params : ',{sdpPath,outputPath});
        createSdpFile(this.saudioConsumer,this.screenConsumer,this.saudioPort,this.screenPort,sdpPath);
        const ffmpegProc=startFfmpeg(sdpPath,outputPath); 
        this.screenFFmpegProcess=ffmpegProc;
        console.log('Screen Recording started');
    }

    // to stop the shared screen recording
    async stopSharedScreenRecording(){
        if(this.screenFFmpegProcess){
            this.screenFFmpegProcess.stdin.write("q"); 
            this.screenFFmpegProcess.stdin.end();
            this.screenFFmpegProcess=null;
            console.log(`FFmpeg stopped for screen recording`);
        }
        this.screenTransport?.close();
        this.saudioTransport?.close();
        this.screenConsumer?.close();
        this.saudioConsumer?.close();
        if(this.screenPort) rtpPool.releasePort(this.screenPort);
        if(this.saudioPort) rtpPool.releasePort(this.saudioPort);
        this.screenPort=null;
        this.saudioPort=null;    
        this.screenConsumer=null;
        this.saudioConsumer=null;
        this.screenTransport=null;
        this.saudioTransport=null;
        this.screen='';
        console.log('Stopped shared screen recording');
    }

}

export default Room;

// screen already shared and after that we start recording 