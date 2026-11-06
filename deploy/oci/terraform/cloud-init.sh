#!/bin/bash
# Runs once on each app VM: installs docker, writes .env and compose file, pulls images from OCIR and starts the stack.
# The first VM (metadata msea_role=web+scheduler) also runs the scheduler container.
set -euo pipefail
dnf install -y dnf-utils && dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo && dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload
mkdir -p /opt/msea && cd /opt/msea
ROLE=$(curl -s -H "Authorization: Bearer Oracle" http://169.254.169.254/opc/v2/instance/metadata/msea_role || echo web)
cat > .env <<ENV
MSEA_ENV=production
SECRET_KEY=${secret_key}
JWT_SECRET=${jwt_secret}
DATABASE_URL=mysql+pymysql://${db_user}:${db_password}@${db_host}:3306/msea?charset=utf8mb4
CORS_ORIGINS=https://${domain}
TIMEZONE=Asia/Kolkata
ACADEMIC_YEAR=2026-27
SCHEDULER_ENABLED=0
LOG_LEVEL=INFO
ENV
cat > docker-compose.yml <<YML
services:
  api:
    image: ${ocir_image_api}
    env_file: .env
    restart: unless-stopped
    volumes: [ "/var/msea/uploads:/var/msea/uploads" ]
  web:
    image: ${ocir_image_web}
    ports: [ "80:80" ]
    depends_on: [ api ]
    restart: unless-stopped
YML
if [ "$ROLE" = "web+scheduler" ]; then cat >> docker-compose.yml <<YML
  scheduler:
    image: ${ocir_image_api}
    env_file: .env
    environment: { SCHEDULER_ENABLED: "1", GUNICORN_WORKERS: "1" }
    command: sh -c "gunicorn -c gunicorn.conf.py --bind 127.0.0.1:8001 wsgi:app"
    restart: unless-stopped
YML
fi
mkdir -p /var/msea/uploads && chown 1000:1000 /var/msea/uploads
# OCIR login uses an auth token stored in OCI Vault in a real setup; here it is expected in /opt/msea/ocir.token (placed by ops via bastion)
if [ -f /opt/msea/ocir.token ]; then docker login $(echo ${ocir_image_api} | cut -d/ -f1) -u "$(cat /opt/msea/ocir.user)" --password-stdin < /opt/msea/ocir.token; fi
docker compose pull && docker compose up -d
# one-time: create the database schema if empty is done by the api container (alembic upgrade head on start)
