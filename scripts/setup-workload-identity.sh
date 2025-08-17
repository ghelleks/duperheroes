#!/bin/bash

# DuperHeroes - Workload Identity Federation Setup Script
# 
# This script sets up Workload Identity Federation for GitHub Actions
# to authenticate with Google Cloud without service account keys.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_ACCOUNT_NAME="hero-image-generator"
POOL_ID="github-actions-pool"
PROVIDER_ID="github-actions-provider"
GITHUB_REPO="ghelleks/duperheroes"

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  DuperHeroes - Workload Identity Federation Setup${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI (gcloud) is not installed."
        print_info "Install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check authentication
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
    REQUIRED_ACCOUNT="gunnar@hellekson.com"
    
    if [ -z "$CURRENT_ACCOUNT" ]; then
        print_error "Not authenticated with Google Cloud."
        print_info "Run: gcloud auth login $REQUIRED_ACCOUNT"
        exit 1
    fi
    
    if [ "$CURRENT_ACCOUNT" != "$REQUIRED_ACCOUNT" ]; then
        print_error "Currently authenticated as: $CURRENT_ACCOUNT"
        print_error "Required account: $REQUIRED_ACCOUNT"
        print_info "Run: gcloud config set account $REQUIRED_ACCOUNT"
        exit 1
    fi
    
    # Get project ID
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project specified."
        print_info "Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_info "Using project: $PROJECT_ID"
    print_info "Authenticated as: $CURRENT_ACCOUNT"
    echo ""
}

enable_apis() {
    print_step "Enabling required APIs..."
    
    APIS=(
        "iamcredentials.googleapis.com"
        "sts.googleapis.com"
        "aiplatform.googleapis.com"
    )
    
    for api in "${APIS[@]}"; do
        print_info "Enabling $api..."
        if gcloud services enable "$api" --project="$PROJECT_ID"; then
            print_success "✓ $api enabled"
        else
            print_error "Failed to enable $api"
            exit 1
        fi
    done
    echo ""
}

create_workload_identity_pool() {
    print_step "Creating Workload Identity Pool..."
    
    # Check if pool already exists
    if gcloud iam workload-identity-pools describe "$POOL_ID" --location="global" --project="$PROJECT_ID" &>/dev/null; then
        print_warning "Workload Identity Pool already exists: $POOL_ID"
    else
        print_info "Creating Workload Identity Pool: $POOL_ID"
        if gcloud iam workload-identity-pools create "$POOL_ID" \
            --location="global" \
            --display-name="GitHub Actions Pool" \
            --description="Pool for GitHub Actions authentication" \
            --project="$PROJECT_ID"; then
            print_success "✓ Workload Identity Pool created"
        else
            print_error "Failed to create Workload Identity Pool"
            exit 1
        fi
    fi
    echo ""
}

create_workload_identity_provider() {
    print_step "Creating Workload Identity Provider..."
    
    # Check if provider already exists
    if gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
        --workload-identity-pool="$POOL_ID" \
        --location="global" \
        --project="$PROJECT_ID" &>/dev/null; then
        print_warning "Workload Identity Provider already exists: $PROVIDER_ID"
    else
        print_info "Creating Workload Identity Provider: $PROVIDER_ID"
        if gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
            --workload-identity-pool="$POOL_ID" \
            --location="global" \
            --issuer-uri="https://token.actions.githubusercontent.com" \
            --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
            --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
            --project="$PROJECT_ID"; then
            print_success "✓ Workload Identity Provider created"
        else
            print_error "Failed to create Workload Identity Provider"
            exit 1
        fi
    fi
    echo ""
}

configure_service_account_iam() {
    print_step "Configuring Service Account IAM..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Check if service account exists
    if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
        print_error "Service account not found: $SERVICE_ACCOUNT_EMAIL"
        print_info "Please run the GCP setup script first: npm run setup-gcp"
        exit 1
    fi
    
    # Allow the Workload Identity Pool to impersonate the service account
    print_info "Adding IAM policy binding for Workload Identity Pool..."
    if gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/iam.workloadIdentityUser" \
        --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$GITHUB_REPO" \
        --project="$PROJECT_ID"; then
        print_success "✓ IAM policy binding added"
    else
        print_error "Failed to add IAM policy binding"
        exit 1
    fi
    echo ""
}

get_provider_info() {
    print_step "Getting Workload Identity Provider information..."
    
    # Get project number
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    
    # Construct provider resource name
    WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"
    WIF_SERVICE_ACCOUNT="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    print_success "✓ Workload Identity Federation configured successfully!"
    echo ""
}

print_github_secrets() {
    print_step "GitHub Secrets Configuration"
    
    echo "📋 Required GitHub Secrets:"
    echo "=========================="
    echo ""
    echo -e "${YELLOW}1. WIF_PROVIDER${NC}"
    echo "   Value: $WIF_PROVIDER"
    echo ""
    echo -e "${YELLOW}2. WIF_SERVICE_ACCOUNT${NC}"
    echo "   Value: $WIF_SERVICE_ACCOUNT"
    echo ""
    echo -e "${YELLOW}3. GCP_PROJECT_ID${NC}"
    echo "   Value: $PROJECT_ID"
    echo ""
    echo -e "${YELLOW}4. REQUIRED_GCLOUD_ACCOUNT${NC}"
    echo "   Value: gunnar@hellekson.com"
    echo ""
    
    echo "📝 Instructions:"
    echo "==============="
    echo "1. Go to your GitHub repository: https://github.com/$GITHUB_REPO"
    echo "2. Settings → Secrets and variables → Actions"
    echo "3. Click 'New repository secret'"
    echo "4. Create each secret with the name and value shown above"
    echo ""
    echo "For detailed instructions, see: GITHUB_ACTIONS_SETUP.md"
    echo ""
    
    echo -e "${GREEN}🎉 Workload Identity Federation setup completed!${NC}"
    echo ""
    echo "Benefits:"
    echo "• No service account keys to manage"
    echo "• Automatic credential rotation"
    echo "• Enhanced security with short-lived tokens"
    echo "• GitHub OIDC integration"
    echo ""
    echo "Next steps:"
    echo "1. Configure the GitHub secrets shown above"
    echo "2. Test the GitHub Actions workflow"
    echo "3. Generate hero images automatically!"
}

main() {
    print_header
    check_prerequisites
    enable_apis
    create_workload_identity_pool
    create_workload_identity_provider
    configure_service_account_iam
    get_provider_info
    print_github_secrets
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi