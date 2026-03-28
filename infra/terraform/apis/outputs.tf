output "enabled_apis" {
  description = "APIs enabled by this Terraform stack"
  value       = sort(keys(google_project_service.api))
}
