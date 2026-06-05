#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Building WASM audio engine..."
CARGO_TARGET_DIR=./target cargo build --release --target wasm32-unknown-unknown

cp ./target/wasm32-unknown-unknown/release/uke_sensei_wasm.wasm ../public/audio-engine.wasm

echo "Done! $(ls -lh ../public/audio-engine.wasm | awk '{print $5}') -> public/audio-engine.wasm"
