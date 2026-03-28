variable "project_id" {
  description = "GCP project ID where APIs will be enabled"
  type        = string
}

variable "region" {
  description = "Default region for provider operations"
  type        = string
  default     = "northamerica-northeast1"
}

variable "enable_optional_apis" {
  description = "Enable optional APIs useful for scheduling, secrets, and future hardening"
  type        = bool
  default     = true
}
