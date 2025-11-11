// Secret Manager: JWT_SECRET, DATABASE_URL, REDIS_URL

resource "scaleway_secret" "jwt_secret" {
  name        = "${var.app_name}-JWT_SECRET"
  description = "JWT secret for ${var.app_name}"
}

resource "scaleway_secret_version" "jwt_secret_v" {
  secret_id = scaleway_secret.jwt_secret.id
  data      = var.jwt_secret
}

resource "scaleway_secret" "database_url" {
  name        = "${var.app_name}-DATABASE_URL"
  description = "Database connection URL for ${var.app_name}"
}

// Placeholder; actual version with the computed URL is created in rdb.tf with depends_on
resource "scaleway_secret_version" "database_url_placeholder" {
  secret_id = scaleway_secret.database_url.id
  data      = "pending"
}

resource "scaleway_secret" "redis_url" {
  name        = "${var.app_name}-REDIS_URL"
  description = "Redis connection URL for ${var.app_name}"
}

// Placeholder; actual version with the computed URL is created in either redis_managed.tf or redis_vm.tf
resource "scaleway_secret_version" "redis_url_placeholder" {
  secret_id = scaleway_secret.redis_url.id
  data      = "pending"
}

// Data sources to fetch latest secret values (used in container environment variables)
// These read the actual secret values to inject them as regular environment variables
// instead of using secret_environment_variables which injects secret IDs
data "scaleway_secret_version" "jwt_secret_latest" {
  secret_id = scaleway_secret.jwt_secret.id
  revision  = "latest"
  depends_on = [scaleway_secret_version.jwt_secret_v]
}

data "scaleway_secret_version" "database_url_latest" {
  secret_id = scaleway_secret.database_url.id
  revision  = "latest"
  depends_on = [scaleway_secret_version.database_url_v]
}

data "scaleway_secret_version" "redis_url_latest" {
  secret_id = scaleway_secret.redis_url.id
  revision  = "latest"
  depends_on = [scaleway_secret_version.redis_url_vm_v]
}


