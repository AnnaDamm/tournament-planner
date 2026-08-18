#!/usr/bin/env bash
set -euo pipefail
npm install
npm run build
echo "Offline-Build liegt in ./dist/index.html (CSS und JS sind vollständig eingebettet)."
