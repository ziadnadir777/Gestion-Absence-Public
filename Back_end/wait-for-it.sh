#!/bin/bash

set -e

host="$1"
port="${2:-5432}"  # default port
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  echo "⏳ Waiting for $host:$port..."
  sleep 1
done

echo "✅ $host:$port is available — executing command..."
exec $cmd