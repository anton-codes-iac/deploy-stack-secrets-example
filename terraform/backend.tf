terraform {
  backend "s3" {
    bucket       = "deploy-stack-secrets-example-tfstate-710596603276"
    key          = "state/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}