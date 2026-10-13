#!/usr/bin/env bash
set -euo pipefail
export ASTRA_README_BASE_URL=http://127.0.0.1:3031/
export ASTRA_MIRROR_PORT=3031
export NEXT_TELEMETRY_DISABLED=1
python3 -u deploy/catalog-mirror.py lib/i18n.ts > "$RUNNER_TEMP/astra-build-mirror.log" 2>&1 &
mirror_pid=$!
trap 'kill "$mirror_pid" 2>/dev/null || true' EXIT
python3 deploy/smoke.py --mirror "$ASTRA_README_BASE_URL" --registry lib/i18n.ts
npm run build
node --input-type=module -e 'import { cp, mkdir } from "node:fs/promises"; await cp("public", ".next/standalone/public", { recursive: true }); await mkdir(".next/standalone/.next", { recursive: true }); await cp(".next/static", ".next/standalone/.next/static", { recursive: true });'
HOSTNAME=127.0.0.1 PORT=3101 node .next/standalone/server.js > "$RUNNER_TEMP/astra-build-app.log" 2>&1 &
app_pid=$!
trap 'kill "$app_pid" "$mirror_pid" 2>/dev/null || true' EXIT
python3 deploy/smoke.py http://127.0.0.1:3101 --sha "$ASTRA_BUILD_SHA" --registry lib/i18n.ts
node --experimental-strip-types scripts/smoke-content.mjs http://127.0.0.1:3101
python3 deploy/package.py
