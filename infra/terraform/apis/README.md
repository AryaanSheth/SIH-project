# API Enablement (Terraform)

This Terraform stack enables the GCP APIs needed by the SIH Rizz-istential Crisis project.

## Included APIs

Required:
- `serviceusage.googleapis.com`
- `firebase.googleapis.com`
- `firebasedatabase.googleapis.com`
- `storage.googleapis.com`
- `run.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `iam.googleapis.com`
- `cloudresourcemanager.googleapis.com`

Optional (enabled by default):
- `secretmanager.googleapis.com`
- `cloudscheduler.googleapis.com`
- `pubsub.googleapis.com`
- `aiplatform.googleapis.com`

## Usage

```bash
cd infra/terraform/apis
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars if needed
terraform init
terraform plan
terraform apply
```

## Notes

- `disable_on_destroy = false` intentionally keeps APIs enabled on destroy.
- You still need to configure Firebase resources, database rules, bucket IAM, and Cloud Run deploy separately.
