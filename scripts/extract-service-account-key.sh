#!/bin/bash

# Extract and minify service account key for GitHub Secrets
# 
# This script reads the service account key JSON and outputs it
# in a format suitable for pasting into GitHub Secrets.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

KEY_FILE="hero-image-generator/credentials/service-account-key.json"

echo -e "${GREEN}🔑 Service Account Key Extractor${NC}"
echo "=================================="
echo ""

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo -e "${RED}❌ Service account key not found at: $KEY_FILE${NC}"
    echo ""
    echo "Please run the setup script first:"
    echo "  npm run setup-gcp"
    exit 1
fi

# Check if key file is empty
if [ ! -s "$KEY_FILE" ]; then
    echo -e "${RED}❌ Service account key file is empty: $KEY_FILE${NC}"
    echo ""
    echo "This usually means key creation failed during setup."
    echo "This is common in enterprise environments with organizational policies."
    echo ""
    echo "Alternative options:"
    echo "1. Use Workload Identity Federation (recommended for GitHub Actions)"
    echo "2. Contact your organization admin to create the service account key manually"
    echo "3. Use a different authentication method"
    echo ""
    echo "For GitHub Actions, we recommend Workload Identity Federation."
    echo "See the GitHub Actions documentation for setup instructions:"
    echo "https://github.com/google-github-actions/auth#workload-identity-federation"
    exit 1
fi

echo -e "${GREEN}✅ Found service account key: $KEY_FILE${NC}"
echo ""

# Extract project ID from the key file
PROJECT_ID=$(cat "$KEY_FILE" | jq -r '.project_id' 2>/dev/null || echo "unknown")

echo "📋 GitHub Secrets Configuration"
echo "==============================="
echo ""
echo -e "${YELLOW}1. GCP_PROJECT_ID${NC}"
echo "   Value: $PROJECT_ID"
echo ""

echo -e "${YELLOW}2. GCP_SA_KEY${NC}"
echo "   Value (copy the minified JSON below):"
echo "   ⬇️  START COPYING FROM HERE  ⬇️"
echo ""

# Minify the JSON (remove all whitespace and newlines)
cat "$KEY_FILE" | jq -c .

echo ""
echo "   ⬆️  STOP COPYING HERE  ⬆️"
echo ""

echo -e "${YELLOW}3. REQUIRED_GCLOUD_ACCOUNT${NC}"
echo "   Value: gunnar@hellekson.com"
echo ""

echo "📝 Instructions:"
echo "==============="
echo "1. Go to your GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Create each secret with the name and value shown above"
echo ""
echo "For detailed setup instructions, see: GITHUB_ACTIONS_SETUP.md"
echo ""