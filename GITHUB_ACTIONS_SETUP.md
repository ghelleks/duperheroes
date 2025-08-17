# GitHub Actions Setup for Hero Image Generation

This document explains how to configure GitHub Actions to automatically generate missing hero images during deployment using Workload Identity Federation.

## Overview

The GitHub Actions workflow has been enhanced to:
- Authenticate with Google Cloud using Workload Identity Federation (no service account keys!)
- Generate missing hero images using Vertex AI
- Commit the generated images back to the repository
- Include the new images in the GitHub Pages deployment

## Authentication Method: Workload Identity Federation

This setup uses **Workload Identity Federation** instead of service account keys for enhanced security:
- ✅ No secret keys to manage or rotate
- ✅ Short-lived, automatically managed tokens
- ✅ GitHub OIDC integration
- ✅ Google Cloud recommended approach
- ✅ Reduced security risk

## Setup Steps

### 1. Configure Workload Identity Federation

Run the automated setup script:
```bash
npm run setup-workload-identity
```

This script will:
- Enable required Google Cloud APIs
- Create a Workload Identity Pool
- Create a Workload Identity Provider for GitHub Actions
- Configure IAM bindings for your service account
- Display the required GitHub secrets

### 2. Required GitHub Secrets

After running the setup script, configure these secrets in your GitHub repository:

#### WIF_PROVIDER
**Description**: The Workload Identity Provider resource name.
**Value**: Provided by the setup script (format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`)

#### WIF_SERVICE_ACCOUNT
**Description**: The service account email to impersonate.
**Value**: `hero-image-generator@duperheroes.iam.gserviceaccount.com`

#### GCP_PROJECT_ID
**Description**: Your Google Cloud Project ID.
**Value**: `duperheroes`

#### REQUIRED_GCLOUD_ACCOUNT
**Description**: The required Google Cloud account for security verification.
**Value**: `gunnar@hellekson.com`

## Workflow Features

### Manual Trigger
The workflow can be triggered manually via GitHub Actions UI with options:
- **Generate images**: Enable/disable image generation (default: true)
- **Batch size**: Number of images to generate per run (default: 5)

### Automatic Trigger
The workflow runs automatically on:
- Push to `production` branch
- Pull requests to `production` branch

### Safety Features
- Image generation only runs on the `production` branch
- All steps have `continue-on-error: true` to prevent deployment failures
- Git commits only happen if new images are actually generated
- Account verification ensures only the correct user can generate images

## Workflow Steps

1. **Checkout code and setup Node.js**
2. **Fetch heroes from Google Doc** (existing step)
3. **Audit hero images** (existing step)
4. **Authenticate to Google Cloud** (new)
5. **Set up Google Cloud SDK** (new)
6. **Configure Git for commits** (new)
7. **Generate missing hero images** (new)
8. **Commit generated images back to repo** (new)
9. **Setup and deploy to GitHub Pages** (existing)

### 3. Configure GitHub Secrets

1. Go to your GitHub repository: https://github.com/ghelleks/duperheroes
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Create each secret with the exact name and value provided by the setup script

## Environment Variables

The workflow configures these environment variables for image generation:
- `GOOGLE_CLOUD_PROJECT`: From GitHub secret (duperheroes)
- `VERTEX_AI_REGION`: us-central1
- `VERTEX_AI_MODEL`: imagen-3.0-generate-002
- `OUTPUT_DIRECTORY`: GitHub Actions runner path to public/images
- `BATCH_SIZE`: From workflow input (default: 5)
- `RATE_LIMIT_DELAY`: 2000ms
- `MAX_RETRIES`: 3
- `DRY_RUN`: false
- `VERBOSE_LOGGING`: true

## Testing

### Dry Run Testing
To test without actually generating images:
1. Temporarily set `DRY_RUN: true` in the workflow
2. Run the workflow manually
3. Check the logs to verify everything works
4. Set `DRY_RUN: false` for actual generation

### Small Batch Testing
1. Set batch size to 1 or 2 for initial tests
2. Monitor the workflow execution
3. Verify images are generated and committed
4. Increase batch size once confirmed working

## Expected Behavior

When the workflow runs successfully:
1. Missing hero images are identified by the audit step
2. Google Cloud authentication is established
3. Images are generated using Vertex AI Imagen API
4. Generated images are saved to `public/images/`
5. A commit is created with the new images
6. The commit is pushed back to the `production` branch
7. GitHub Pages deploys with the new images included

## Troubleshooting

### Authentication Issues
- Verify Workload Identity Federation is set up correctly
- Check that `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are correct
- Ensure the GitHub repository matches the one configured in the Workload Identity Provider
- Verify `REQUIRED_GCLOUD_ACCOUNT` matches the expected account

### Permission Issues
- Verify the service account has `roles/aiplatform.user` role
- Check that required APIs are enabled: `iamcredentials.googleapis.com`, `sts.googleapis.com`, `aiplatform.googleapis.com`
- Confirm billing is enabled for the project
- Verify IAM bindings allow the Workload Identity Pool to impersonate the service account

### Git Commit Issues
- The workflow has `contents: write` permission
- Git is configured with a bot user for commits
- Commits only happen if new files are actually generated

### Workload Identity Federation Issues
- Check that the GitHub repository and branch match the attribute conditions
- Verify the OIDC token is being issued correctly by GitHub Actions
- Ensure the Workload Identity Pool and Provider exist in the correct project

## Security Considerations

- **No service account keys** - Uses secure token exchange instead
- **Short-lived credentials** - Tokens automatically expire
- **Repository restrictions** - Only specific GitHub repository can authenticate
- **Branch restrictions** - Image generation only runs on the `production` branch
- **Account verification** - Prevents unauthorized usage
- **Rate limiting** - All API calls are rate-limited and have retry logic
- **Graceful failure** - The workflow uses `continue-on-error` to prevent deployment blocking