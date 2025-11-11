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
  environment_variables = {
    NODE_ENV = "production"
  }

  // Secret environment variables from Secret Manager (map format)
  secret_environment_variables = {
    DATABASE_URL = scaleway_secret.database_url.id
    REDIS_URL    = scaleway_secret.redis_url.id
    JWT_SECRET   = scaleway_secret.jwt_secret.id
  }

  depends_on = [
    scaleway_secret_version.database_url_v,
    // Redis URL secret (VM-based only for now, managed Redis not available in provider)
    scaleway_secret_version.redis_url_vm_v
  ]
}


