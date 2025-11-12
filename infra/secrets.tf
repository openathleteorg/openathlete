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

resource "scaleway_secret" "strava_client_secret" {
  name        = "${var.app_name}-STRAVA_CLIENT_SECRET"
  description = "Strava client secret for ${var.app_name}"
}

resource "scaleway_secret_version" "strava_client_secret_v" {
  secret_id = scaleway_secret.strava_client_secret.id
  data      = var.strava_client_secret
}

resource "scaleway_secret" "strava_webhook_token" {
  name        = "${var.app_name}-STRAVA_WEBHOOK_TOKEN"
  description = "Strava webhook token for ${var.app_name}"
}

resource "scaleway_secret_version" "strava_webhook_token_v" {
  secret_id = scaleway_secret.strava_webhook_token.id
  data      = var.strava_webhook_token
}

resource "scaleway_secret" "openai_api_key" {
  name        = "${var.app_name}-OPENAI_API_KEY"
  description = "OpenAI API key for ${var.app_name}"
}

resource "scaleway_secret_version" "openai_api_key_v" {
  secret_id = scaleway_secret.openai_api_key.id
  data      = var.openai_api_key
}

resource "scaleway_secret" "brevo_api_key" {
  name        = "${var.app_name}-BREVO_API_KEY"
  description = "Brevo API key for ${var.app_name}"
}

resource "scaleway_secret_version" "brevo_api_key_v" {
  secret_id = scaleway_secret.brevo_api_key.id
  data      = var.brevo_api_key
}
