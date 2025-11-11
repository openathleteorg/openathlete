// Managed Redis (single-node) on Private Network
// NOTE: Scaleway's Terraform provider does not currently support managed Redis instances.
// This file is kept for future compatibility when the provider adds support.
// For now, use VM-based Redis (redis_vm.tf) by setting use_managed_redis=false (default).

// TODO: Uncomment when scaleway_redis_instance resource becomes available in the provider
/*
resource "scaleway_redis_instance" "managed" {
  count       = var.use_managed_redis ? 1 : 0
  project_id  = var.scw_project_id
  region      = var.scw_region
  name        = "${var.app_name}-redis"
  node_type   = var.redis_managed_node_type
  version     = "7.2"
  tls_enabled = false

  private_network {
    pn_id = scaleway_vpc_private_network.pn.id
  }
}
*/

// If redis_password not provided, generate one (shared with VM Redis)
resource "random_password" "redis_password" {
  length  = 24
  special = true
}

locals {
  effective_redis_password = var.redis_password != "" ? var.redis_password : random_password.redis_password.result
}

// REDIS_URL for managed Redis (currently disabled - see note above)
// This resource will be enabled when managed Redis support is added to the provider
/*
resource "scaleway_secret_version" "redis_url_managed_v" {
  count     = var.use_managed_redis ? 1 : 0
  secret_id = scaleway_secret.redis_url.id
  data = try(
    "redis://:${urlencode(local.effective_redis_password)}@${scaleway_redis_instance.managed[0].endpoints[0].private_network_ip}:6379/0",
    ""
  )

  depends_on = [
    scaleway_redis_instance.managed
  ]
}
*/
