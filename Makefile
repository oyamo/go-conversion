.PHONY: build wasm frontend clean

wasm:
	cd go-wasm && tinygo build -o ../frontend/src/assets/wasm/converter.wasm -target=wasm ./cmd/wasm
	cp $$(tinygo env TINYGOROOT)/targets/wasm_exec.js frontend/src/assets/wasm/

frontend:
	npm --prefix frontend install
	npm --prefix frontend run build

build: wasm frontend

start: wasm
	npm --prefix frontend start

clean:
	rm -f frontend/src/assets/wasm/converter.wasm
	rm -f frontend/src/assets/wasm/wasm_exec.js

