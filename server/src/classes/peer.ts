import { Producer, Transport, Consumer, PlainTransport } from "mediasoup/node/lib/types";
import { rtpPool } from "..";
import { ChildProcessWithoutNullStreams } from "child_process";

class Peer{
    public userId : string; 
    public name : string;
    public socketId : string;
    public producers : {
        cam : Producer | null,
        mic : Producer | null,
        screen : Producer | null,
        saudio : Producer | null
    }
    public upTransport : Transport | null;
    public downTransport : Transport | null;
    public consumers : Consumer[];
    public screen : boolean;
    public videoConsumer : Consumer | null;
    public audioConsumer : Consumer | null;
    public videoPlainTransport : PlainTransport | null;
    public audioPlainTransport : PlainTransport | null;
    public audioPort:number | null;
    public videoPort:number | null;
    public ffmpegProcess : ChildProcessWithoutNullStreams | null;

    constructor(name : string,socketId : string,userId : string){
        this.userId=userId;
        this.name=name;
        this.socketId=socketId,
        this.producers={
            cam : null,
            mic : null,
            screen : null,
            saudio : null 
        },
        this.upTransport=null,
        this.downTransport=null,
        this.consumers=[],
        this.screen=false,
        this.videoConsumer=null;
        this.audioConsumer=null;
        this.videoPlainTransport=null;
        this.audioPlainTransport=null;
        this.audioPort=null;
        this.videoPort=null;
        this.ffmpegProcess=null;
    }

    async stopRecording() {
        if(this.ffmpegProcess){
            this.ffmpegProcess.stdin.write("q"); 
            this.ffmpegProcess.stdin.end();
            this.ffmpegProcess=null;
            console.log(`FFmpeg stopped for peer ${this.socketId}`);
        }
    }

    async closeRecordingConsumers(){
        await this.stopRecording();
        this.audioPlainTransport?.close();
        this.videoPlainTransport?.close();
        this.audioConsumer?.close();
        this.videoConsumer?.close();
        if(this.videoPort) rtpPool.releasePort(this.videoPort);
        if(this.audioPort) rtpPool.releasePort(this.audioPort);
        this.videoPort=null;
        this.audioPort=null;    
        this.videoConsumer=null;
        this.audioConsumer=null;
        this.videoPlainTransport=null;
        this.audioPlainTransport=null;
    }
}

export default Peer;