variable "region" { default = "ap-hyderabad-1" }
variable "compartment_ocid" {}
variable "availability_domain" { description = "e.g. Xyzw:AP-HYDERABAD-1-AD-1" }
variable "admin_cidr" { description = "Office IP range allowed to SSH to the bastion" }
variable "ssh_public_key" {}
variable "domain" { default = "erp.msea.example.com" }
variable "app_count" { default = 2 }
variable "app_shape" { default = "VM.Standard.E4.Flex" }
variable "db_shape" { default = "MySQL.VM.Standard.E4.1.8GB" }
variable "db_admin_user" { default = "msea" }
variable "db_admin_password" { sensitive = true }
variable "secret_key" { sensitive = true }
variable "jwt_secret" { sensitive = true }
variable "tls_cert" { sensitive = true }
variable "tls_key" { sensitive = true }
variable "tls_ca" { sensitive = true; default = "" }
variable "ocir_image_api" { description = "e.g. hyd.ocir.io/<ns>/msea/api:<sha>" }
variable "ocir_image_web" { description = "e.g. hyd.ocir.io/<ns>/msea/web:<sha>" }
