provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  required_apis = toset([
    # Required to manage service API enablement itself.
    "serviceusage.googleapis.com",

    # Frontend + Firebase data plane.
    "firebase.googleapis.com",
    "firebasedatabase.googleapis.com",

    # GCS transcript storage.
    "storage.googleapis.com",

    # Cloud Run export service deploy path.
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",

    # IAM + resource plumbing used during Terraform/deploy flows.
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com"
  ])

  optional_apis = toset([
    # Optional but handy for production-ish hardening and automation.
    "secretmanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com",

    # If you migrate Gemini calls from API-key client calls to Vertex later.
    "aiplatform.googleapis.com"
  ])

  all_apis = var.enable_optional_apis ? setunion(local.required_apis, local.optional_apis) : local.required_apis
}

resource "google_project_service" "api" {
  for_each = local.all_apis

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}
