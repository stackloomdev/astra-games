#!/usr/bin/env bash
set -euo pipefail
cd /opt/astra-games/current
export HOSTNAME=127.0.0.1 PORT=3000
if [[ -f server.js ]]; then
  exec /opt/node-v24.21.0/bin/node server.js
fi
# Keep the existing source-based release usable for the first rollback.
exec /opt/node-v24.21.0/bin/node node_modules/next/dist/bin/next start --hostname "$HOSTNAME" --port "$PORT"
