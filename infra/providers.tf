// OpenTofu/Terraform provider configuration for Scaleway
// Credentials are read from environment variables:
//   SCW_ACCESS_KEY, SCW_SECRET_KEY, SCW_DEFAULT_PROJECT_ID, SCW_DEFAULT_REGION
// Region defaults to "fr-par" but can be overridden via var.scw_region or env

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = ">= 2.34.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }
}

provider "scaleway" {
  project_id = var.scw_project_id
  region     = var.scw_region
  zone       = "${var.scw_region}-1"
}


