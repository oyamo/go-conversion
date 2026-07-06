#!/bin/bash
cd "$(dirname "$0")"
tinygo build -o ../frontend/src/assets/wasm/converter.wasm -target=wasm ./cmd/wasm
TINYGOROOT_VAL=$(tinygo env TINYGOROOT)
cp "$TINYGOROOT_VAL/targets/wasm_exec.js" ../frontend/src/assets/wasm/
