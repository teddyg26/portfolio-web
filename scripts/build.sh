#!/bin/sh
set -eu

case "${1-}" in
  ""|--watch) ;;
  *) printf 'Usage: %s [--watch]\n' "$0" >&2; exit 1 ;;
esac

if [ "$#" -gt 1 ]; then
  printf 'Usage: %s [--watch]\n' "$0" >&2
  exit 1
fi

if ! command -v tailwindcss >/dev/null 2>&1; then
  printf 'Tailwind CLI not found. Install with brew install tailwindcss or use the official standalone CLI.\n' >&2
  exit 1
fi

# Resolve paths from this script, so the build also works outside the repository.
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if [ "${1-}" = "--watch" ]; then
  exec tailwindcss --input ./src/styles.css --output ./public/styles.css --watch
fi

exec tailwindcss --input ./src/styles.css --output ./public/styles.css --minify
