package image

import (
	"fmt"
	"syscall/js"
	"go-wasm/internal/registry"
)

func convertSvgToPng(data []byte) ([]byte, error) {
	svgStr := string(data)

	// Inject the JS helper dynamically if not already defined
	js.Global().Get("eval").Invoke(`
	if (!window.svgToPng) {
		window.svgToPng = function(svgStr) {
			return new Promise((resolve, reject) => {
				try {
					const img = new Image();
					img.onload = () => {
						const canvas = document.createElement('canvas');
						canvas.width = img.width || 500;
						canvas.height = img.height || 500;
						const ctx = canvas.getContext('2d');
						ctx.drawImage(img, 0, 0);
						
						const dataUrl = canvas.toDataURL('image/png');
						const base64 = dataUrl.split(',')[1];
						const binaryStr = atob(base64);
						const len = binaryStr.length;
						const bytes = new Uint8Array(len);
						for (let i = 0; i < len; i++) {
							bytes[i] = binaryStr.charCodeAt(i);
						}
						resolve(bytes);
					};
					img.onerror = (e) => reject(new Error("Failed to load SVG image"));
					img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
				} catch (err) {
					reject(err);
				}
			});
		}
	}
	`)

	jsPromise := js.Global().Call("svgToPng", svgStr)
	
	ch := make(chan []byte, 1)
	errCh := make(chan error, 1)
	
	resolve := js.FuncOf(func(this js.Value, args []js.Value) any {
		jsArray := args[0]
		length := jsArray.Get("length").Int()
		bytes := make([]byte, length)
		js.CopyBytesToGo(bytes, jsArray)
		ch <- bytes
		return nil
	})
	defer resolve.Release()

	reject := js.FuncOf(func(this js.Value, args []js.Value) any {
		errCh <- fmt.Errorf("svg rasterization failed: %s", args[0].String())
		return nil
	})
	defer reject.Release()

	jsPromise.Call("then", resolve, reject)

	select {
	case bytes := <-ch:
		return bytes, nil
	case err := <-errCh:
		return nil, err
	}
}

func init() {
	registry.Register(registry.Converter{
		From:     "svg",
		To:       "png",
		MIMEType: "image/png",
		Label:    "SVG to PNG",
		Convert:  convertSvgToPng,
	})
}
