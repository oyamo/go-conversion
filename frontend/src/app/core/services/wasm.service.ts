import { Injectable, signal } from '@angular/core';

declare const Go: any;

@Injectable({
  providedIn: 'root'
})
export class WasmService {
  public wasmLoaded = signal<boolean>(false);
  private go: any = null;

  constructor() {
    this.initWasm();
  }

  private async initWasm() {
    if (this.wasmLoaded()) return;

    try {
      // 1. Load wasm_exec.js if it hasn't been loaded
      if (typeof Go === 'undefined') {
        await this.loadScript('assets/wasm/wasm_exec.js');
      }

      // 2. Initialize Go runner
      this.go = new Go();

      // 3. Fetch and instantiate the WASM module
      const response = await fetch('assets/wasm/converter.wasm');
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const result = await WebAssembly.instantiate(buffer, this.go.importObject);
      
      // 4. Run the Go WASM instance (non-blocking)
      this.go.run(result.instance);
      
      console.log('Golang WebAssembly loaded successfully!');
      this.wasmLoaded.set(true);
    } catch (error) {
      console.error('Failed to load WASM module. Using mock converter fallback.', error);
      // Fallback: we will use simulation if WASM is not present
      this.wasmLoaded.set(false);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  /**
   * Helper to invoke conversion function registered in Go WASM window context.
   */
  public async convertFile(fileData: Uint8Array, fromFormat: string, toFormat: string): Promise<Uint8Array> {
    // If WASM is loaded, call the Go global function (e.g. window.convertFileWasm)
    const globalWindow = window as any;
    if (this.wasmLoaded() && typeof globalWindow.convertFileWasm === 'function') {
      try {
        return await globalWindow.convertFileWasm(fileData, fromFormat, toFormat);
      } catch (err) {
        throw new Error(`Go WASM Conversion error: ${err}`);
      }
    } else {
      // Mock simulation fallback
      console.warn('WASM not loaded. Using fallback mock conversion.');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fileData); // return unchanged data as mock
        }, 1500);
      });
    }
  }
}
