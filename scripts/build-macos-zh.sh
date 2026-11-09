#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "macOS is required to package DMG installers. Web assets can be built on Linux with: vp run --filter @t3tools/web build" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

architectures=("$@")
if [[ ${#architectures[@]} -eq 0 ]]; then
  architectures=(arm64 x64)
fi
for architecture in "${architectures[@]}"; do
  if [[ "$architecture" != "arm64" && "$architecture" != "x64" && "$architecture" != "universal" ]]; then
    echo "Usage: bash scripts/build-macos-zh.sh [arm64] [x64] [universal]" >&2
    exit 1
  fi
done

for tool in node vp cargo rustup xcrun; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing prerequisite: $tool. See docs/operations/chinese-build.md." >&2
    exit 1
  fi
done

required_node="$(node -p 'JSON.parse(require("node:fs").readFileSync("package.json", "utf8")).engines.node')"
if [[ "$(node -p 'process.versions.node')" != "$required_node" ]]; then
  echo "Use Node.js $required_node as specified in package.json." >&2
  exit 1
fi

export T3CODE_DESKTOP_UPDATE_REPOSITORY=freezezhang/t3code-zh

vp install --filter=t3... --filter=@t3tools/web... --filter=@t3tools/desktop... --filter=@t3tools/scripts...

for architecture in "${architectures[@]}"; do
  if [[ "$architecture" == "universal" ]]; then
    rustup target add aarch64-apple-darwin x86_64-apple-darwin
  elif [[ "$architecture" == "arm64" ]]; then
    rustup target add aarch64-apple-darwin
  else
    rustup target add x86_64-apple-darwin
  fi
  vp run dist:desktop:artifact --platform mac --target dmg --arch "$architecture" --build-version 0.1.7-zh.1
done

echo "Build complete. Installers are in release/."
