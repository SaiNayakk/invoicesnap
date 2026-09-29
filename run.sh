#!/bin/sh
set -e
cd "$(dirname "$0")"

export PORT=3002
echo "Starting InvoiceSnap on port 3002..."
exec ./node_modules/.bin/next start -p 3002
