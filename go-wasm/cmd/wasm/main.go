package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"go-wasm/internal/registry"
	
	_ "go-wasm/internal/converters/archive"
	_ "go-wasm/internal/converters/audio"
	_ "go-wasm/internal/converters/document"
	_ "go-wasm/internal/converters/image"
	_ "go-wasm/internal/converters/video"
)

type JSConverter struct {
	From     string `json:"from"`
	To       string `json:"to"`
	MIMEType string `json:"mimeType"`
	Label    string `json:"label"`
}

func main() {
	js.Global().Set("convertFileWasm", js.FuncOf(convertFileWasm))
	js.Global().Set("listConvertersWasm", js.FuncOf(listConvertersWasm))

	fmt.Println("Golang WebAssembly File Converter Loaded!")

	select {}
}

func listConvertersWasm(this js.Value, args []js.Value) any {
	converters := registry.All()
	jsList := make([]JSConverter, len(converters))
	for i, c := range converters {
		jsList[i] = JSConverter{
			From:     c.From,
			To:       c.To,
			MIMEType: c.MIMEType,
			Label:    c.Label,
		}
	}

	bytes, err := json.Marshal(jsList)
	if err != nil {
		return js.ValueOf(fmt.Sprintf("[]"))
	}
	return js.ValueOf(string(bytes))
}

func convertFileWasm(this js.Value, args []js.Value) any {
	if len(args) < 3 {
		return js.ValueOf("Error: Invalid arguments. Expected (fileData Uint8Array, fromFormat string, toFormat string)")
	}

	jsData := args[0]
	fromFormat := args[1].String()
	toFormat := args[2].String()
	
	password := ""
	if len(args) >= 4 {
		password = args[3].String()
	}

	inputLen := jsData.Get("length").Int()
	inputBytes := make([]byte, inputLen)
	js.CopyBytesToGo(inputBytes, jsData)

	return createJSPromise(func() (any, error) {
		registry.SetPassword(password)
		outputBytes, err := registry.Convert(inputBytes, fromFormat, toFormat)
		if err != nil {
			return nil, err
		}

		uint8Array := js.Global().Get("Uint8Array").New(len(outputBytes))
		js.CopyBytesToJS(uint8Array, outputBytes)
		return uint8Array, nil
	})
}

func createJSPromise(fn func() (any, error)) js.Value {
	handler := js.FuncOf(func(this js.Value, args []js.Value) any {
		resolve := args[0]
		reject := args[1]

		go func() {
			result, err := fn()
			if err != nil {
				reject.Invoke(js.Global().Get("Error").New(err.Error()))
			} else {
				resolve.Invoke(result)
			}
		}()

		return nil
	})

	promiseClass := js.Global().Get("Promise")
	return promiseClass.New(handler)
}
