# OCI deployment (Terraform)

Topology: Internet → OCI Load Balancer (HTTPS, cert you supply) → 2 app VMs in a private subnet
(docker: nginx+PWA, Flask/gunicorn API, one scheduler container on VM-1) → MySQL HeatWave DB System (private subnet, automatic backups).
Uploads/backups → Object Storage buckets. A bastion in the public subnet gives SSH access.

Steps
1. Build & push images (CI does this): `deploy/ci/github-actions.yml`. Create an OCIR auth token for the ops user.
2. `cp prod.tfvars.example prod.tfvars` and fill values; put TLS certs in `certs/`.
3. `terraform init && terraform plan -var-file=prod.tfvars && terraform apply -var-file=prod.tfvars`
4. Create the `msea` database once: `ssh -J opc@<bastion_ip> opc@<app-1>` then
   `docker run --rm mysql:8.4 mysql -h <mysql_private_ip> -umsea -p -e "CREATE DATABASE msea CHARACTER SET utf8mb4;"`
5. On app-1: `docker compose exec api python -m scripts.seed --no-demo` (roles, permissions, gap rules, superadmin). Change the superadmin password at first login.
6. Point DNS (A record) of your domain to `load_balancer_ip`.

Upgrades: push to main → CI builds images with the commit SHA → on each VM `docker compose pull && docker compose up -d`
(the api container runs `alembic upgrade head` on start, so schema changes apply before the new code serves traffic).
Rollback: set the previous image tag and `docker compose up -d`; if a migration must be reverted, `docker compose exec api alembic downgrade -1`.

Sizing: VM.Standard.E4.Flex 2 OCPU/16 GB ×2 and MySQL E4 1 OCPU/8 GB comfortably serve ~300 concurrent users across branches.
