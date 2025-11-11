// Private networking for the application

resource "scaleway_vpc_private_network" "pn" {
  project_id = var.scw_project_id
  name       = "${var.app_name}-pn"
  // IPAM is automatically handled for attached resources that request an IP.
  // This network will be used by RDB, Redis (managed or VM), and Serverless Containers.
}


