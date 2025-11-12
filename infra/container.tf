// Serverless Containers for the NestJS API

resource "scaleway_container_namespace" "ns" {
  project_id = var.scw_project_id
  name       = var.app_name
  region     = var.scw_region
}

resource "scaleway_container" "api" {
  name         = "${var.app_name}-api"
  namespace_id = scaleway_container_namespace.ns.id
  region       = var.scw_region

  // Placeholder image; CI will push and update to a digest/tag
  registry_image = "rg.${var.scw_region}.scw.cloud/${var.app_name}/${var.app_name}:latest"

  min_scale = var.container_min_scale
  max_scale = var.container_max_scale

  // HTTP port exposed by the runtime
  http_option = "enabled"
  port        = 3000

  // Attach to the private network
  private_network_id = scaleway_vpc_private_network.pn.id

  // Static environment variables
  // Note: PORT is reserved by Scaleway containers and is automatically set from the port attribute
  // We use secret version resources directly to get the actual values (not IDs)
  environment_variables = {
    NODE_ENV       = "production"
    DATABASE_URL   = scaleway_secret_version.database_url_v.data
    REDIS_URL      = scaleway_secret_version.redis_url_managed_v.data
    JWT_SECRET_KEY = scaleway_secret_version.jwt_secret_v.data
    APP_URL        = "https://openathlete.org"
    BREVO_FROM_EMAIL = "noreply@openathlete.org"
    CORS_ORIGINS    = "https://openathlete.org,https://www.openathlete.org"
    HASH_PEPPER     = "do9721dof29721dof"
    NODE_VERSION    = "22.14.0"
    STRAVA_CLIENT_ID = "151078"
    STRAVA_REDIRECT_URI = "https://openathlete.org/auth/callback/strava"
    STRAVA_CLIENT_SECRET = scaleway_secret_version.strava_client_secret_v.data
    STRAVA_WEBHOOK_TOKEN = scaleway_secret_version.strava_webhook_token_v.data
    OPENAI_API_KEY = scaleway_secret_version.openai_api_key_v.data
    BREVO_API_KEY = scaleway_secret_version.brevo_api_key_v.data
  }

  depends_on = [
    scaleway_secret_version.database_url_v,
    scaleway_secret_version.jwt_secret_v,
    scaleway_secret_version.redis_url_managed_v,
    scaleway_secret_version.strava_client_secret_v,
    scaleway_secret_version.strava_webhook_token_v,
    scaleway_secret_version.openai_api_key_v,
    scaleway_secret_version.brevo_api_key_v
  ]
}


