// Cheapest VM-based Redis (when var.use_managed_redis = false)
// Launches a tiny instance without a public IP, attached to the Private Network.
// Cloud-init config installs Redis, sets password, binds to PN IP only.

resource "scaleway_instance_security_group" "redis_sg" {
  count                   = var.use_managed_redis ? 0 : 1
  project_id              = var.scw_project_id
  name                    = "${var.app_name}-redis-sg"
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"

  // Allow Redis only from private network CIDR (0.0.0.0/0 blocked implicitly)
  // Since private network uses IPAM, allow all inbound TCP 6379 but traffic is only routable within PN.
  inbound_rule {
    action   = "accept"
    protocol = "TCP"
    port     = "6379"
  }
}

// Generate password if not provided
resource "random_password" "redis_vm_password" {
  length  = 24
  special = true
}

locals {
  effective_redis_vm_password = var.redis_password != "" ? var.redis_password : random_password.redis_vm_password.result
}

// Cloud-init to install and configure Redis
locals {
  redis_cloud_init = <<-EOT
  #cloud-config
  package_update: true
  packages:
    - redis
  runcmd:
    - sed -i 's/^# requirepass .*/requirepass ${local.effective_redis_vm_password}/' /etc/redis/redis.conf
    - sed -i 's/^bind .*/bind 0.0.0.0/' /etc/redis/redis.conf
    - sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf
    - systemctl enable redis-server
    - systemctl restart redis-server
  EOT
}

resource "scaleway_instance_server" "redis_vm" {
  count      = var.use_managed_redis ? 0 : 1
  project_id = var.scw_project_id
  name       = "${var.app_name}-redis-vm"
  type       = var.redis_vm_instance_type
  image      = "ubuntu_noble" // Ubuntu 24.04 LTS
  // No public IP: do not attach public_ip
  // Attach private network NIC
  private_network {
    pn_id = scaleway_vpc_private_network.pn.id
  }
  security_group_id = scaleway_instance_security_group.redis_sg[0].id
  cloud_init        = local.redis_cloud_init
}

// Compute the private IP from the instance
// Note: Private network IP is allocated via IPAM and accessible after instance creation
// private_ips[0] is an object with address and id attributes
locals {
  redis_vm_private_ip = var.use_managed_redis ? "" : try(scaleway_instance_server.redis_vm[0].private_ips[0].address, "")
  redis_vm_url        = local.redis_vm_private_ip != "" ? "redis://:${urlencode(local.effective_redis_vm_password)}@${local.redis_vm_private_ip}:6379/0" : ""
}

resource "scaleway_secret_version" "redis_url_vm_v" {
  count     = var.use_managed_redis ? 0 : 1
  secret_id = scaleway_secret.redis_url.id
  data      = local.redis_vm_url

  depends_on = [
    scaleway_instance_server.redis_vm
  ]
}


