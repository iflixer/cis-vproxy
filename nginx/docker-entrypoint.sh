#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] starting nginx entrypoint script"

TEMPLATE=${NGINX_TEMPLATE:-/etc/nginx/nginx.conf.template}
OUTPUT=${NGINX_CONF:-/etc/nginx/nginx.conf}

render_one() {
  local tpl="$1" out="$2"
  echo "[entrypoint] rendering template $tpl to $out"

  if [ -n "${SUBST_VARS:-}" ]; then
    echo "[entrypoint] envsubst ${SUBST_VARS} < $tpl > $out"
    envsubst "${SUBST_VARS}" < "$tpl" > "$out"
    return
  fi

  echo "[entrypoint] no SUBST_VARS set, auto-detecting variables in $tpl"

  # ВАЖНО: не ломаемся, если совпадений нет
  local TOKENS
    TOKENS="$(grep -oE '\$\{[A-Z0-9_]+\}' "$tpl" || true)"
    if [ -z "$TOKENS" ]; then
        echo "[entrypoint] no variables found in $tpl, copy as is"
        cp "$tpl" "$out"
    else
        VARS="$(echo "$TOKENS" | sort -u | tr -d '${}' | sed 's/^/${/; s/$/}/' | tr '\n' ' ')"
        echo "[entrypoint] found variables: $VARS"
        envsubst "$VARS" < "$tpl" > "$out"
    fi
}

render_one "$TEMPLATE" "$OUTPUT"
echo "[entrypoint] nginx config rendered to $OUTPUT"
echo "[entrypoint] checking nginx config syntax"

# cat "$OUTPUT"

/usr/sbin/nginx -t
echo "[entrypoint] nginx config syntax is valid"

echo "[entrypoint] starting nginx"
exec /usr/sbin/nginx -g 'daemon off;'