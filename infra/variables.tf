// Centralized variables with sane defaults and clear descriptions

variable "scw_project_id" {
  description = "Scaleway Project ID for all resources (can be overridden via env SCW_DEFAULT_PROJECT_ID)."
  type        = string
  default     = "525a8ce4-4325-41bc-a766-d42a74907118"
}

variable "scw_region" {
  description = "Default Scaleway region where resources will be created."
  type        = string
  default     = "fr-par"
}

variable "app_name" {
  description = "Application slug/name used for naming resources."
  type        = string
  default     = "openathlete"
}

variable "container_min_scale" {
  description = "Minimum number of serverless container instances (0 to scale-to-zero)."
  type        = number
  default     = 0
}

variable "container_max_scale" {
  description = "Maximum number of serverless container instances for autoscaling."
  type        = number
  default     = 3
}

variable "db_instance_node_type" {
  description = "Managed PostgreSQL node type (size/tier)."
  type        = string
  default     = "DB-DEV-S"
}

variable "db_version" {
  description = "Managed PostgreSQL major version."
  type        = string
  default     = "16"
}

variable "db_name" {
  description = "Default application database name to create."
  type        = string
  default     = "openathlete"
}

variable "db_user" {
  description = "Database user to create for the application."
  type        = string
  default     = "openathlete"
}

variable "db_volume_size_gb" {
  description = "Volume size (GiB) for the managed PostgreSQL instance."
  type        = number
  default     = 20
}

variable "use_managed_redis" {
  description = "Feature toggle: true for Managed Redis, false for cheapest VM-based Redis. NOTE: Managed Redis is not yet available in the Scaleway Terraform provider, so this must be false for now."
  type        = bool
  default     = false
}

variable "redis_managed_node_type" {
  description = "Managed Redis node type (single-node smallest tier recommended)."
  type        = string
  default     = "RED1-MICRO"
}

variable "redis_vm_instance_type" {
  description = "Instance type for the cheapest VM-based Redis (no public IP, private only)."
  type        = string
  default     = "DEV1-S"
}

variable "jwt_secret" {
  description = "JWT secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database user password (if not provided, one will be generated)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password (if not provided, one will be generated)."
  type        = string
  default     = ""
  sensitive   = true
}


