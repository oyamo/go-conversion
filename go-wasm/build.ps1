tinygo build -o ../frontend/src/assets/wasm/converter.wasm -target=wasm ./cmd/wasm
$tinygoRoot = (tinygo env TINYGOROOT)
Copy-Item "$tinygoRoot\targets\wasm_exec.js" -Destination ../frontend/src/assets/wasm/ -Force
