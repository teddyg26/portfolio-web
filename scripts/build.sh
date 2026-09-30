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

watch_mode=${1-}

# Resolve paths from this script, so the build also works outside the repository.
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

# Run the pinned Tailwind CLI with Bun; retain the standalone CLI fallback.
tailwind_cli="$project_dir/node_modules/.bin/tailwindcss"
if [ -x "$tailwind_cli" ]; then
  if ! command -v bun >/dev/null 2>&1; then
    printf 'Bun not found. Install Bun to run the project Tailwind CLI.\n' >&2
    exit 1
  fi
  set -- bun "$tailwind_cli"
elif command -v tailwindcss >/dev/null 2>&1; then
  set -- tailwindcss
else
  printf 'Tailwind CLI not found. Run bun install --frozen-lockfile.\n' >&2
  exit 1
fi

if [ "$watch_mode" = "--watch" ]; then
  exec "$@" --input ./src/styles.css --output ./public/styles.css --watch
fi

exec "$@" --input ./src/styles.css --output ./public/styles.css --minify
