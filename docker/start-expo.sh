#!/bin/sh
set -eu

MODE="${EXPO_MODE:-web}"
HOST_MODE="${EXPO_HOST:-tunnel}"
PORT="${EXPO_PORT:-8081}"
WEB_PORT="${EXPO_WEB_PORT:-19006}"

npm install

if [ "$MODE" = "web" ]; then
  echo "Starting Expo in WEB mode on 0.0.0.0:${WEB_PORT}"
  exec npx expo start --web --non-interactive --host 0.0.0.0 --port "$WEB_PORT"
fi

echo "Starting Expo in NATIVE mode with --host ${HOST_MODE} (QR for Expo Go) on ${PORT}."
exec npx expo start --non-interactive --host "$HOST_MODE" --port "$PORT"
