export class PortPool {
  private availablePorts: number[];
  private usedPorts: Set<number>;

  constructor(startPort: number = 42000, endPort: number = 43999) {
    this.availablePorts = [];
    for (let p = startPort; p <= endPort; p++) {
      this.availablePorts.push(p);
    }
    this.usedPorts = new Set();
  }

  acquirePort(): number {
    if (this.availablePorts.length === 0) {
      throw new Error('No available ports in the pool');
    }
    const port = this.availablePorts.shift()!;
    this.usedPorts.add(port);
    return port;
  }

  releasePort(port: number) {
    if (this.usedPorts.has(port)) {
      this.usedPorts.delete(port);
      this.availablePorts.push(port);
      console.log('port released:', port);
    } else {
      console.warn(`Port ${port} is not in use, cannot release`);
    }
  }

}
