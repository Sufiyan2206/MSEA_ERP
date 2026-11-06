# MSEA ERP on OCI — single-region, production-sized but modest:
#   VCN (public + private subnets) · Load Balancer (HTTPS) · 2× compute VMs running docker compose (web+api, scheduler)
#   MySQL HeatWave DB System (private subnet) · Object Storage bucket (uploads/backups) · NSGs
# terraform init && terraform apply -var-file=prod.tfvars
terraform {
  required_version = ">= 1.5"
  required_providers { oci = { source = "oracle/oci", version = ">= 5.30" } }
}
provider "oci" { region = var.region }

# ---------------- network ----------------
resource "oci_core_vcn" "vcn" { compartment_id = var.compartment_ocid; cidr_blocks = ["10.10.0.0/16"]; display_name = "msea-vcn"; dns_label = "msea" }
resource "oci_core_internet_gateway" "igw" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-igw" }
resource "oci_core_nat_gateway" "nat" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-nat" }
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-rt-public"
  route_rules { destination = "0.0.0.0/0"; network_entity_id = oci_core_internet_gateway.igw.id }
}
resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-rt-private"
  route_rules { destination = "0.0.0.0/0"; network_entity_id = oci_core_nat_gateway.nat.id }
}
resource "oci_core_subnet" "public" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; cidr_block = "10.10.1.0/24"; display_name = "msea-public"; route_table_id = oci_core_route_table.public.id; dns_label = "pub" }
resource "oci_core_subnet" "private" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; cidr_block = "10.10.2.0/24"; display_name = "msea-private"; route_table_id = oci_core_route_table.private.id; prohibit_public_ip_on_vnic = true; dns_label = "priv" }

resource "oci_core_network_security_group" "lb" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-nsg-lb" }
resource "oci_core_network_security_group" "app" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-nsg-app" }
resource "oci_core_network_security_group" "db" { compartment_id = var.compartment_ocid; vcn_id = oci_core_vcn.vcn.id; display_name = "msea-nsg-db" }
resource "oci_core_network_security_group_security_rule" "lb_in_443" { network_security_group_id = oci_core_network_security_group.lb.id; direction = "INGRESS"; protocol = "6"; source = "0.0.0.0/0"; tcp_options { destination_port_range { min = 443; max = 443 } } }
resource "oci_core_network_security_group_security_rule" "lb_in_80" { network_security_group_id = oci_core_network_security_group.lb.id; direction = "INGRESS"; protocol = "6"; source = "0.0.0.0/0"; tcp_options { destination_port_range { min = 80; max = 80 } } }
resource "oci_core_network_security_group_security_rule" "lb_out" { network_security_group_id = oci_core_network_security_group.lb.id; direction = "EGRESS"; protocol = "all"; destination = "0.0.0.0/0" }
resource "oci_core_network_security_group_security_rule" "app_in_lb" { network_security_group_id = oci_core_network_security_group.app.id; direction = "INGRESS"; protocol = "6"; source = oci_core_network_security_group.lb.id; source_type = "NETWORK_SECURITY_GROUP"; tcp_options { destination_port_range { min = 80; max = 80 } } }
resource "oci_core_network_security_group_security_rule" "app_in_ssh" { network_security_group_id = oci_core_network_security_group.app.id; direction = "INGRESS"; protocol = "6"; source = var.admin_cidr; tcp_options { destination_port_range { min = 22; max = 22 } } }
resource "oci_core_network_security_group_security_rule" "app_out" { network_security_group_id = oci_core_network_security_group.app.id; direction = "EGRESS"; protocol = "all"; destination = "0.0.0.0/0" }
resource "oci_core_network_security_group_security_rule" "db_in_app" { network_security_group_id = oci_core_network_security_group.db.id; direction = "INGRESS"; protocol = "6"; source = oci_core_network_security_group.app.id; source_type = "NETWORK_SECURITY_GROUP"; tcp_options { destination_port_range { min = 3306; max = 3306 } } }

# ---------------- database ----------------
resource "oci_mysql_mysql_db_system" "db" {
  compartment_id = var.compartment_ocid; display_name = "msea-mysql"; availability_domain = var.availability_domain
  shape_name = var.db_shape; subnet_id = oci_core_subnet.private.id; data_storage_size_in_gb = 50
  admin_username = var.db_admin_user; admin_password = var.db_admin_password
  backup_policy { is_enabled = true; retention_in_days = 14; window_start_time = "20:00" }
  deletion_policy { is_delete_protected = true; final_backup = "REQUIRE_FINAL_BACKUP" }
  mysql_version = "8.4.0"
}

# ---------------- object storage ----------------
data "oci_objectstorage_namespace" "ns" { compartment_id = var.compartment_ocid }
resource "oci_objectstorage_bucket" "uploads" { compartment_id = var.compartment_ocid; namespace = data.oci_objectstorage_namespace.ns.namespace; name = "msea-uploads"; versioning = "Enabled" }
resource "oci_objectstorage_bucket" "backups" { compartment_id = var.compartment_ocid; namespace = data.oci_objectstorage_namespace.ns.namespace; name = "msea-backups" }

# ---------------- compute ----------------
data "oci_core_images" "ol" { compartment_id = var.compartment_ocid; operating_system = "Oracle Linux"; operating_system_version = "9"; shape = var.app_shape; sort_by = "TIMECREATED"; sort_order = "DESC" }
locals {
  cloud_init = base64encode(templatefile("${path.module}/cloud-init.sh", {
    db_host = oci_mysql_mysql_db_system.db.ip_address, db_user = var.db_admin_user, db_password = var.db_admin_password,
    secret_key = var.secret_key, jwt_secret = var.jwt_secret, domain = var.domain, ocir_image_api = var.ocir_image_api, ocir_image_web = var.ocir_image_web
  }))
}
resource "oci_core_instance" "app" {
  count = var.app_count
  compartment_id = var.compartment_ocid; availability_domain = var.availability_domain; display_name = "msea-app-${count.index + 1}"; shape = var.app_shape
  shape_config { ocpus = 2; memory_in_gbs = 16 }
  source_details { source_type = "image"; source_id = data.oci_core_images.ol.images[0].id; boot_volume_size_in_gbs = 80 }
  create_vnic_details { subnet_id = oci_core_subnet.private.id; assign_public_ip = false; nsg_ids = [oci_core_network_security_group.app.id] }
  metadata = { ssh_authorized_keys = var.ssh_public_key, user_data = local.cloud_init, msea_role = count.index == 0 ? "web+scheduler" : "web" }
}
resource "oci_core_instance" "bastion" {
  compartment_id = var.compartment_ocid; availability_domain = var.availability_domain; display_name = "msea-bastion"; shape = "VM.Standard.E4.Flex"
  shape_config { ocpus = 1; memory_in_gbs = 2 }
  source_details { source_type = "image"; source_id = data.oci_core_images.ol.images[0].id }
  create_vnic_details { subnet_id = oci_core_subnet.public.id; assign_public_ip = true; nsg_ids = [oci_core_network_security_group.app.id] }
  metadata = { ssh_authorized_keys = var.ssh_public_key }
}

# ---------------- load balancer ----------------
resource "oci_load_balancer_load_balancer" "lb" {
  compartment_id = var.compartment_ocid; display_name = "msea-lb"; shape = "flexible"; subnet_ids = [oci_core_subnet.public.id]; network_security_group_ids = [oci_core_network_security_group.lb.id]
  shape_details { minimum_bandwidth_in_mbps = 10; maximum_bandwidth_in_mbps = 100 }
}
resource "oci_load_balancer_backend_set" "web" {
  load_balancer_id = oci_load_balancer_load_balancer.lb.id; name = "msea-web"; policy = "ROUND_ROBIN"
  health_checker { protocol = "HTTP"; port = 80; url_path = "/health"; interval_ms = 10000; return_code = 200 }
}
resource "oci_load_balancer_backend" "web" { count = var.app_count; load_balancer_id = oci_load_balancer_load_balancer.lb.id; backendset_name = oci_load_balancer_backend_set.web.name; ip_address = oci_core_instance.app[count.index].private_ip; port = 80 }
resource "oci_load_balancer_certificate" "cert" {
  load_balancer_id = oci_load_balancer_load_balancer.lb.id; certificate_name = "msea-cert"; public_certificate = var.tls_cert; private_key = var.tls_key; ca_certificate = var.tls_ca
  lifecycle { create_before_destroy = true }
}
resource "oci_load_balancer_listener" "https" {
  load_balancer_id = oci_load_balancer_load_balancer.lb.id; name = "https"; default_backend_set_name = oci_load_balancer_backend_set.web.name; port = 443; protocol = "HTTP"
  ssl_configuration { certificate_name = oci_load_balancer_certificate.cert.certificate_name; verify_peer_certificate = false }
}
resource "oci_load_balancer_rule_set" "redirect" {
  load_balancer_id = oci_load_balancer_load_balancer.lb.id; name = "http-to-https"
  items { action = "REDIRECT"; conditions { attribute_name = "PATH"; attribute_value = "/"; operator = "PREFIX_MATCH" }; redirect_uri { protocol = "HTTPS"; port = 443; host = "{host}"; path = "{path}"; query = "{query}" }; response_code = 301 }
}
resource "oci_load_balancer_listener" "http" { load_balancer_id = oci_load_balancer_load_balancer.lb.id; name = "http"; default_backend_set_name = oci_load_balancer_backend_set.web.name; port = 80; protocol = "HTTP"; rule_set_names = [oci_load_balancer_rule_set.redirect.name] }

output "load_balancer_ip" { value = oci_load_balancer_load_balancer.lb.ip_address_details[0].ip_address }
output "bastion_ip" { value = oci_core_instance.bastion.public_ip }
output "mysql_private_ip" { value = oci_mysql_mysql_db_system.db.ip_address }
