// Container Registry namespace to store Docker images

resource "scaleway_registry_namespace" "ns" {
  project_id = var.scw_project_id
  name       = var.app_name
  region     = var.scw_region
  is_public  = false
}

// Note: The Docker registry endpoint format is "rg.${region}.scw.cloud"


