import { Router } from "mediasoup/node/lib/RouterTypes";
import Peer from "./peer";
import { AppData, Producer } from "mediasoup/node/lib/types";

class Room{
    public roomId : string;
    public router : Router | null;
    public peers : Peer[];
    public screen : string;
    public host : string;
    public orgHost : string; 
    public recording : number;

    constructor(roomId : string, router : Router, userId : string){
        this.orgHost=userId; 
        this.host=userId;
        this.roomId=roomId;
        this.router=router;
        this.peers=[];
        this.screen='';
        this.recording=0;
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
}

export default Room;