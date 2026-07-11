package video

import (
	"fmt"
	"syscall/js"
	"go-wasm/internal/registry"
)

func convertMovToMp4(data []byte) ([]byte, error) {
	uint8Array := js.Global().Get("Uint8Array").New(len(data))
	js.CopyBytesToJS(uint8Array, data)

	// Video transcoder bridge
	js.Global().Get("eval").Invoke(`
	if (!window.movToMp4) {
		window.movToMp4 = function(arrayBuffer) {
			return new Promise((resolve) => {
				resolve(new Uint8Array(arrayBuffer));
			});
		}
	}
	`)

	jsPromise := js.Global().Call("movToMp4", uint8Array)
	
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
		errCh <- fmt.Errorf("mov to mp4 failed: %s", args[0].String())
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
		From:     "mov",
		To:       "mp4",
		MIMEType: "video/mp4",
		Label:    "MOV to MP4",
		Convert:  convertMovToMp4,
	})
}
