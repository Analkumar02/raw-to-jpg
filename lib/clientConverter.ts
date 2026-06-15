export default class ClientLibRaw {
  private worker: Worker;
  private waitForWorker: { return: (val: any) => void; error: (err: any) => void } | null = null;

  constructor() {
    this.worker = new Worker("/libraw-wasm/worker.js", { type: "module" });
    this.worker.onmessage = ({ data }) => {
      if (this.waitForWorker) {
        const { return: resolve, error: reject } = this.waitForWorker;
        this.waitForWorker = null;
        if (data?.error) {
          reject(data.error);
        } else {
          resolve(data?.out);
        }
      }
    };
  }

  async runFn(fn: string, ...args: any[]) {
    const prom = new Promise((resolve, reject) => {
      this.waitForWorker = { return: resolve, error: reject };
    });
    // Transfer buffer for performance if applicable
    const transfers: any[] = [];
    for (const arg of args) {
      if (arg instanceof ArrayBuffer) {
        transfers.push(arg);
      } else if (ArrayBuffer.isView(arg)) {
        transfers.push(arg.buffer);
      }
    }
    this.worker.postMessage({ fn, args }, transfers);
    return await prom;
  }

  async open(buffer: ArrayBuffer, settings?: any) {
    return await this.runFn("open", buffer, settings);
  }

  async imageData(): Promise<any> {
    return await this.runFn("imageData");
  }

  async thumbnailData(): Promise<any> {
    return await this.runFn("thumbnailData");
  }
}
