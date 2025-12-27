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
  default     = 1
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

variable "redis_managed_node_type" {
  description = "Managed Redis node type (cheapest plan)."
  type        = string
  default     = "RED1-MICRO"
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

variable "strava_client_secret" {
  description = "Strava client secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "strava_webhook_token" {
  description = "Strava webhook token for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "brevo_api_key" {
  description = "Brevo API key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "garmin_client_secret" {
  description = "Garmin client secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "polar_client_secret" {
  description = "Polar client secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "polar_webhook_secret_key" {
  description = "Polar webhook secret key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "google_generative_ai_api_key" {
  description = "Google Generative AI API key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "suunto_client_secret" {
  description = "Suunto client secret for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "suunto_subscription_key" {
  description = "Suunto subscription key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "hash_pepper" {
  description = "Hash pepper for password hashing (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key for the API (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "stripe_price_ids" {
  description = "Stripe price IDs as JSON string (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "firebase_functions_url" {
  description = "Firebase Functions URL for push notifications (stored in Secret Manager)."
  type        = string
  sensitive   = true
}

variable "better_stack_dsn" {
  description = "Better Stack (Sentry) DSN for error tracking and monitoring (stored in Secret Manager)."
  type        = string
  sensitive   = true
}