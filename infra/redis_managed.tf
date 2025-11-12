// Managed Redis (single-node) on Private Network
// Using the cheapest plan (RED1-MICRO)
resource "scaleway_redis_cluster" "redis" {
  project_id   = var.scw_project_id
  name         = "${var.app_name}-redis"
  version      = "7.2.11"
  node_type    = var.redis_managed_node_type
  cluster_size  = 1
  tls_enabled  = false
  user_name    = "redis"
  password     = local.effective_redis_password

  private_network {
    id         = scaleway_vpc_private_network.pn.id
    service_ips = []  # Use IPAM to auto-allocate IP
  }
}

// Generate password if not provided
resource "random_password" "redis_password" {
  length  = 24
  special = true
}

locals {
  effective_redis_password = var.redis_password != "" ? var.redis_password : random_password.redis_password.result
}

// REDIS_URL for managed Redis
locals {
  # Extract private network IP from Redis cluster
  # private_network is a set, so we need to use for expression
  # service_ips may be in CIDR format (e.g., "192.168.0.110/24"), extract just the IP
  redis_private_ip_raw = try([
    for pn in scaleway_redis_cluster.redis.private_network : pn.service_ips[0]
    if length(pn.service_ips) > 0
  ][0], "")
  
  # Extract IP from CIDR format if needed (split on "/" and take first part)
  redis_private_ip = local.redis_private_ip_raw != "" ? (
    split("/", local.redis_private_ip_raw)[0]
  ) : ""
}

resource "scaleway_secret_version" "redis_url_managed_v" {
  secret_id = scaleway_secret.redis_url.id
  
  # Get the private network IP from the managed Redis cluster
  # Managed Redis requires username in URL format: redis://username:password@host:port/db
  data = local.redis_private_ip != "" ? (
    "redis://${scaleway_redis_cluster.redis.user_name}:${urlencode(local.effective_redis_password)}@${local.redis_private_ip}:6379/0"
  ) : ""

  depends_on = [
    scaleway_redis_cluster.redis
  ]
}
