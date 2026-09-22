# Node.js + AWS Secrets Manager & ECS Fargate (via deploy-stack) ☁️🔐

> A production-grade reference architecture demonstrating zero-plaintext secret injection into AWS ECS Fargate using AWS Secrets Manager and [deploy-stack](https://github.com/anton-codes-iac/deploy-stack).

[![deploy-stack](https://img.shields.io/badge/deploy--stack-CLI-blue.svg)](https://github.com/anton-codes-iac/deploy-stack)
[![Security: AWS Secrets Manager](https://img.shields.io/badge/Security-AWS_Secrets_Manager-orange.svg)](https://aws.amazon.com/secrets-manager/)
[![DevSecOps: Trivy](https://img.shields.io/badge/DevSecOps-Trivy_Clean-brightgreen.svg)](https://github.com/aquasecurity/trivy)

## 🌟 The Magic: Zero Plaintext in Git

Traditional deployments often leak credentials through committed `.env` files or long-lived CI/CD repository secrets. 

This repository demonstrates a **zero-secret GitOps workflow**:
1. Secret values are pushed directly from your local workstation to **AWS Secrets Manager** via `deploy-stack secrets push .env`.
2. Only the *variable names* are tracked in Git (`terraform/secret_keys.json`).
3. During deployment, Terraform reads the key list and maps each secret directly from AWS Secrets Manager into the Fargate task definition.
4. The container boots with secrets pre-populated in memory (`process.env`), with **zero secrets ever stored in GitHub Actions or Git history**.

## 🏗️ Architecture Features

* **Zero-Secret CI/CD:** GitHub Actions uses AWS IAM OIDC for passwordless authentication; no AWS keys or application secrets are stored in GitHub repository settings.
* **Encrypted at Rest & Transit:** Sensitive values reside exclusively inside AWS Secrets Manager encrypted with AWS KMS.
* **Dynamic Runtime Injection:** ECS pulls secret values securely into container memory during boot.
* **Live Integration Demo:** Exposes an endpoint querying GitHub's REST API using a runtime-injected `GITHUB_TOKEN`.
* **Built-in DevSecOps:** Automated container linting and vulnerability scanning via Trivy on every commit.

## 🚀 How It Works (The 4-Step Lifecycle)

### 1. Scaffold & Provision Vault
```bash
npx deploy-stack --headless --framework=node
npx deploy-stack apply
```
*Creates the network, Fargate task, ALB, and dedicated AWS Secrets Manager vault.*

### 2. Push Secret Values to AWS
Create a local `.env` file (which is gitignored by default):
```bash
echo "GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere" > .env
```

Sync it securely to your AWS account:
```bash
npx deploy-stack secrets push .env
```
*The CLI updates AWS Secrets Manager and creates `terraform/secret_keys.json` with `["GITHUB_TOKEN"]`.*

### 3. Commit the Key Map
```bash
git add terraform/secret_keys.json
git commit -m "chore: map GITHUB_TOKEN to ECS container"
git push origin main
```
> ⚠️ **Commit this file.** `secret_keys.json` holds key *names* only — never values. It is completely safe for version control and Terraform strictly requires it to map the variables to your ECS container during the GitHub Actions deployment.

### 4. Verify Live Ingestion
When your container boots, visit the public ALB URL. The Express service authenticates against GitHub's API using the runtime secret:

```json
{
  "status": "success",
  "message": "Secret successfully resolved by ECS from AWS Secrets Manager!",
  "authenticated_as": "your-username",
  "token_fingerprint": "ghp_...ab12"
}
```

### 🔄 Day-2: Hot Restarts & Team Syncing

Secrets don't stand still. Once the initial vault is provisioned, `deploy-stack` provides native commands to manage drift, rotate keys, and onboard teammates:

* **Live Hot Restarts:** If you only change a secret's *value* (e.g., rotating an existing token) without adding new keys, running `npx deploy-stack secrets push .env` will detect this and offer to trigger an instant rolling ECS restart. The new values go live in seconds without requiring a GitHub push or CI/CD run.
* **Team Syncing (`pull`):** Did a teammate update a key, or did you get a new laptop? Run `npx deploy-stack secrets pull` to securely merge the live AWS vault down into your local `.env` file.
* **Drift Detection (`audit`):** Unsure why local works but prod is failing? Run `npx deploy-stack secrets audit` to see a colored diff of your local `.env` versus the live AWS vault (shows missing, mismatched, and untracked variables).

## 🛑 Safe Teardown

To destroy all provisioned AWS resources (including the Secrets Manager vault, ALB, and ECS service) and halt billing:

```bash
npx --yes deploy-stack destroy
```

## 💰 AWS Costs & Disclaimer
**This tool provisions real AWS resources which incur charges on your AWS bill.** An ECS Fargate cluster with an Application Load Balancer running 24/7 typically costs ~$15 - $25/month depending on region. AWS Secrets Manager charges $0.40/month per active secret.

*Disclaimer: The maintainers are not responsible for AWS charges. Always monitor your AWS Billing Dashboard.*