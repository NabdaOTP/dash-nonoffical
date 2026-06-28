#!/usr/bin/env sh
set -eu

APP_NAME="${APP_NAME:?Set APP_NAME, for example dash}"
IMAGE="${IMAGE:?Set IMAGE, for example ghcr.io/org/dash}"
IMAGE_TAG="${IMAGE_TAG:?Set IMAGE_TAG}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:?Set PRIMARY_DOMAIN}"
DOMAINS="${DOMAINS:-$PRIMARY_DOMAIN}"
ACME_EMAIL="${ACME_EMAIL:-}"
BLUE_PORT="${BLUE_PORT:-3001}"
GREEN_PORT="${GREEN_PORT:-3002}"
ACTIVE_COLOR_FILE="${ACTIVE_COLOR_FILE:-/etc/nabdaotp/frontends/${APP_NAME}-active-color}"
HOST_NGINX_CONF="${HOST_NGINX_CONF:-/etc/nginx/conf.d/${APP_NAME}.conf}"
HEALTH_PATH="${HEALTH_PATH:-/}"
STOP_OLD_AFTER_SWITCH="${STOP_OLD_AFTER_SWITCH:-false}"
NGINX_SSL_CERT="${NGINX_SSL_CERT:-/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem}"
NGINX_SSL_KEY="${NGINX_SSL_KEY:-/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem}"

mkdir -p "$(dirname "$ACTIVE_COLOR_FILE")" "$(dirname "$HOST_NGINX_CONF")"

current_color="$(cat "$ACTIVE_COLOR_FILE" 2>/dev/null || printf 'blue')"
case "$current_color" in
  blue)
    target_color="green"
    target_port="$GREEN_PORT"
    old_color="blue"
    ;;
  green)
    target_color="blue"
    target_port="$BLUE_PORT"
    old_color="green"
    ;;
  *)
    echo "Invalid active color '$current_color' in $ACTIVE_COLOR_FILE" >&2
    exit 1
    ;;
esac

container_name="${APP_NAME}-${target_color}"
old_container_name="${APP_NAME}-${old_color}"

reload_host_nginx() {
  if command -v sudo >/dev/null 2>&1; then
    sudo -n nginx -t
    sudo -n systemctl reload nginx
  else
    nginx -t
    systemctl reload nginx
  fi
}

render_nginx_config() {
  upstream_port="$1"
  mode="$2"

  cat > "$HOST_NGINX_CONF" <<EOF
server {
  listen 80;
  server_name ${DOMAINS};
EOF

  if [ "$mode" = "http" ]; then
    cat >> "$HOST_NGINX_CONF" <<EOF

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
    proxy_pass http://127.0.0.1:${upstream_port};
  }
}
EOF
    return 0
  fi

  cat >> "$HOST_NGINX_CONF" <<EOF
  return 301 https://\$host\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name ${DOMAINS};

  ssl_certificate ${NGINX_SSL_CERT};
  ssl_certificate_key ${NGINX_SSL_KEY};
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
    proxy_pass http://127.0.0.1:${upstream_port};
  }
}
EOF
}

retry() {
  attempts="${DEPLOY_PULL_RETRIES:-5}"
  delay="${DEPLOY_PULL_RETRY_DELAY_SECONDS:-10}"
  count=1

  until "$@"; do
    status="$?"
    if [ "$count" -ge "$attempts" ]; then
      return "$status"
    fi

    echo "Command failed with status ${status}. Retrying ${count}/${attempts} in ${delay}s: $*" >&2
    sleep "$delay"
    count=$((count + 1))
  done
}

echo "Pulling ${IMAGE}:${IMAGE_TAG}..."
retry docker image pull "${IMAGE}:${IMAGE_TAG}"

echo "Starting inactive ${APP_NAME} color ${target_color} on 127.0.0.1:${target_port}..."
docker rm -f "$container_name" >/dev/null 2>&1 || true
docker run -d \
  --name "$container_name" \
  --restart unless-stopped \
  --publish "127.0.0.1:${target_port}:3000" \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --env HOSTNAME=0.0.0.0 \
  "${IMAGE}:${IMAGE_TAG}" >/dev/null

echo "Waiting for ${container_name} to become healthy..."
attempt=1
until curl -fsS "http://127.0.0.1:${target_port}${HEALTH_PATH}" >/dev/null; do
  if [ "$attempt" -ge "${HEALTH_CHECK_ATTEMPTS:-30}" ]; then
    docker logs "$container_name" >&2 || true
    exit 1
  fi

  sleep "${HEALTH_CHECK_DELAY_SECONDS:-2}"
  attempt=$((attempt + 1))
done

if [ ! -f "$NGINX_SSL_CERT" ] || [ ! -f "$NGINX_SSL_KEY" ]; then
  : "${ACME_EMAIL:?Set ACME_EMAIL so certbot can issue the frontend certificate}"

  echo "Writing temporary HTTP nginx config for certificate issuance..."
  render_nginx_config "$target_port" http
  reload_host_nginx

  certbot_args=""
  for domain in $DOMAINS; do
    certbot_args="$certbot_args -d $domain"
  done

  if command -v sudo >/dev/null 2>&1; then
    # shellcheck disable=SC2086
    sudo -n certbot certonly --nginx --non-interactive --agree-tos -m "$ACME_EMAIL" $certbot_args
  else
    # shellcheck disable=SC2086
    certbot certonly --nginx --non-interactive --agree-tos -m "$ACME_EMAIL" $certbot_args
  fi
fi

echo "Switching ${DOMAINS} to ${target_color}..."
render_nginx_config "$target_port" https
reload_host_nginx
printf '%s\n' "$target_color" > "$ACTIVE_COLOR_FILE"

if [ "$STOP_OLD_AFTER_SWITCH" = "true" ]; then
  docker rm -f "$old_container_name" >/dev/null 2>&1 || true
fi

if [ "${PRUNE_OLD_IMAGES:-true}" = "true" ]; then
  docker image prune -f --filter "until=${IMAGE_PRUNE_UNTIL:-168h}" >/dev/null
fi

echo "Frontend deployment completed successfully. ${APP_NAME} active color: ${target_color}"