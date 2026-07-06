$env:GOOS = "js"
$env:GOARCH = "wasm"
& "C:\Program Files\Go\bin\go.exe" build -ldflags="-s -w" -o ../frontend/src/assets/wasm/converter.wasm ./cmd/wasm
Copy-Item "C:\Program Files\Go\lib\wasm\wasm_exec.js" -Destination ../frontend/src/assets/wasm/ -Force
