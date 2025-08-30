"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortPool = void 0;
class PortPool {
    constructor(startPort = 42000, endPort = 43999) {
        this.availablePorts = [];
        for (let p = startPort; p <= endPort; p++) {
            this.availablePorts.push(p);
        }
        this.usedPorts = new Set();
    }
    acquirePort() {
        if (this.availablePorts.length === 0) {
            throw new Error('No available ports in the pool');
        }
        const port = this.availablePorts.shift();
        this.usedPorts.add(port);
        return port;
    }
    releasePort(port) {
        if (this.usedPorts.has(port)) {
            this.usedPorts.delete(port);
            this.availablePorts.push(port);
            console.log('port released:', port);
        }
        else {
            console.warn(`Port ${port} is not in use, cannot release`);
        }
    }
}
exports.PortPool = PortPool;
