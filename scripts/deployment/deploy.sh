#!/usr/bin/env bash

set -e

if ! node -e 'process.exit(require("./app.json").expo.extra?.eas?.projectId ? 0 : 1)'; then
  echo "⚠️ Skipping the mobile deploy: this app has no EAS project yet. Run pnpm exec eas init and pnpm exec eas update:configure in mobile first."
  exit 0
fi

if ! pnpm exec eas whoami </dev/null >/dev/null 2>&1; then
  echo "🔑 Logging in to Expo..."
  pnpm exec eas login
fi

echo "🚀 Publishing an update with EAS Update..."
pnpm exec eas update --auto "$@"
