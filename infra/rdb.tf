// Managed PostgreSQL 16 on Private Network only (no public endpoint)

// If db_password not provided, generate one
resource "random_password" "db_password" {
  length  = 32
  special = true
}

locals {
  effective_db_password = var.db_password != "" ? var.db_password : random_password.db_password.result
}

resource "scaleway_rdb_instance" "db" {
  project_id     = var.scw_project_id
  region         = var.scw_region
  name           = "${var.app_name}-db"
  engine         = "PostgreSQL-${var.db_version}"
  node_type      = var.db_instance_node_type
  disable_backup = true
  // Note: volume_size_in_gb is not supported with default lssd volume type
  // The volume size is determined by the node_type for lssd volumes

  // Private network only
  private_network {
    pn_id       = scaleway_vpc_private_network.pn.id
    enable_ipam = true
    // IP is allocated automatically via IPAM on the PN
  }

  // Ensure no public endpoint is created
  // As of the provider, public endpoint is disabled by default when only private_network is set.
}

resource "scaleway_rdb_database" "db_name" {
  instance_id = scaleway_rdb_instance.db.id
  name        = var.db_name
}

resource "scaleway_rdb_user" "db_user" {
  instance_id = scaleway_rdb_instance.db.id
  name        = var.db_user
  password    = local.effective_db_password
  // Set to true to grant admin privileges (CONNECT, CREATE, etc.)
  // This is safe for a dedicated application user on a private network
  is_admin    = true
}

// Build DATABASE_URL from the private network attachment IP
// The instance exposes 'private_network' with an 'ip' that we can reference.
locals {
  rdb_private_ip = try(scaleway_rdb_instance.db.private_network[0].ip, "")
  database_url   = "postgresql://${var.db_user}:${urlencode(local.effective_db_password)}@${local.rdb_private_ip}:5432/${var.db_name}"
}

// Store DATABASE_URL as a secret version (depends on DB readiness)
resource "scaleway_secret_version" "database_url_v" {
  secret_id = scaleway_secret.database_url.id
  data      = local.database_url

  depends_on = [
    scaleway_rdb_instance.db,
    scaleway_rdb_database.db_name,
    scaleway_rdb_user.db_user
  ]
}


