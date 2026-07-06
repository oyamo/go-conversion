# File Converter

Monorepo containing an Angular 21 frontend and Golang WebAssembly (WASM) backend.

## Setup

1. Install Go (1.21+ recommended)
2. Install Node.js (20+ recommended)
3. Install Angular CLI: `npm install -g @angular/cli`

## Build

```bash
# Build WASM and frontend
npm run build

# Start development server
npm run start
```

## Structure

```
file-converter/
├── package.json              # Root build scripts
├── Makefile                  # Task runner
├── go-wasm/                  # Golang WebAssembly
│   ├── go.mod
│   ├── main.go
│   └── pkg/                  # Conversion packages
└── frontend/                 # Angular 21 app
    └── src/assets/wasm/      # WASM output location
```

