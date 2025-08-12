#!/bin/sh
cat > /etc/webdis.json <<EOF
{
  "redis_host": "${REDIS_HOST:-redis}",
  "redis_port": ${REDIS_PORT:-6379},
  "http_host": "0.0.0.0",
  "http_port": 7379
}
EOF

exec "$@"