// Centralized outputs

output "private_network_id" {
  value       = scaleway_vpc_private_network.pn.id
  description = "ID of the private network (VPC)."
}

output "rdb_private_ip" {
  value       = try(scaleway_rdb_instance.db.private_network[0].ip, null)
  description = "Private IP of the PostgreSQL instance."
}

output "redis_private_ip_or_hostname" {
  value       = try(scaleway_instance_server.redis_vm[0].private_ips[0].address, null)
  description = "Private IP of Redis (VM-based, managed Redis not available in provider yet)."
}

output "registry_endpoint" {
  value       = "rg.${var.scw_region}.scw.cloud"
  description = "Registry endpoint for Docker login and image pushes."
}

output "registry_namespace_id" {
  value       = scaleway_registry_namespace.ns.id
  description = "Container Registry namespace ID."
}

output "container_id" {
  value       = scaleway_container.api.id
  description = "Serverless Container ID."
}

output "container_endpoint_url" {
  value       = scaleway_container.api.domain_name
  description = "Public HTTPS endpoint for the Serverless Container."
}

output "container_namespace_id" {
  value       = scaleway_container_namespace.ns.id
  description = "Serverless Container namespace ID."
}


