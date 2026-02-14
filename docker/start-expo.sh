#!/bin/sh
set -eu

MODE="${EXPO_MODE:-native}"
HOST_MODE="${EXPO_HOST:-tunnel}"
PORT="${EXPO_PORT:-8081}"

npm install

if [ "$MODE" = "web" ]; then
  echo "Starting Expo in WEB mode on 0.0.0.0:${PORT}"
  exec npx expo start --web --non-interactive --host 0.0.0.0 --port "$PORT"
fi

echo "Starting Expo in NATIVE mode with --host ${HOST_MODE} (QR for Expo Go)."
exec npx expo start --non-interactive --host "$HOST_MODE" --port "$PORT"
