#!/bin/bash
cd "$(dirname "$0")"
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../frontend/src/assets/wasm/converter.wasm ./cmd/wasm
GOROOT_VAL=$(go env GOROOT)
if [ -f "$GOROOT_VAL/lib/wasm/wasm_exec.js" ]; then
  cp "$GOROOT_VAL/lib/wasm/wasm_exec.js" ../frontend/src/assets/wasm/
else
  cp "$GOROOT_VAL/misc/wasm/wasm_exec.js" ../frontend/src/assets/wasm/
fi
