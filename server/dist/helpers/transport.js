"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebRtcTransport = createWebRtcTransport;
async function createWebRtcTransport(router) {
    const webRtcTransport_Options = {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: '192.168.43.195'
            }
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 1000000,
        maxIncomingBitrate: 1500000
    };
    const transport = await router.createWebRtcTransport(webRtcTransport_Options);
    console.log('Transport created successfully with id : ', transport.id);
    transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed')
            transport.close();
    });
    transport.on('@close', () => {
        console.log('transport closed');
    });
    return transport;
}
