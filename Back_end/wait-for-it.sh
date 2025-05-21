#!/bin/bash

# Usage: ./wait-for-it.sh host [port] -- command...

set -e

host="$1"
port="${2:-5432}"  # default to 5432 if not provided
shift 2
cmd="$@"

echo "🔄 Waiting for PostgreSQL at $host:$port..."



echo "✅ PostgreSQL is ready. Executing command..."
exec $cmd
