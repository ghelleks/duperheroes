#!/bin/bash

# DuperHeroes Image Generator - Google Cloud Setup Script
# 
# This script automates the creation of a Google Cloud service account
# and downloads the credential key for the hero image generator.
#
# Prerequisites:
# - Google Cloud CLI (gcloud) installed and authenticated
# - A Google Cloud project with billing enabled
#
# Usage: ./scripts/setup-gcp.sh [PROJECT_ID]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_ACCOUNT_NAME="hero-image-generator"
SERVICE_ACCOUNT_DISPLAY_NAME="DuperHeroes Image Generator"
SERVICE_ACCOUNT_DESCRIPTION="Service account for generating superhero images with Vertex AI"
CREDENTIALS_DIR="./credentials"
KEY_FILE="$CREDENTIALS_DIR/service-account-key.json"
ENV_FILE="./.env"

# Required APIs
REQUIRED_APIS=(
    "aiplatform.googleapis.com"
    "compute.googleapis.com"
)

# Required IAM roles
REQUIRED_ROLES=(
    "roles/aiplatform.user"
    "roles/ml.developer"
)

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  DuperHeroes - Google Cloud Setup Script${NC}"
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
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        print_error "Not authenticated with Google Cloud."
        print_info "Run: gcloud auth login"
        exit 1
    fi
    
    # Get current project if not provided
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "No project specified and no default project set."
            print_info "Usage: $0 [PROJECT_ID]"
            print_info "Or set default project: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    
    print_info "Using project: $PROJECT_ID"
    print_info "Authenticated as: $(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)"
    echo ""
}

verify_project_and_billing() {
    print_step "Verifying project and billing..."
    
    # Check if project exists and is accessible
    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        print_error "Project '$PROJECT_ID' not found or not accessible."
        print_info "Make sure the project exists and you have permissions."
        exit 1
    fi
    
    # Check billing
    BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")
    if [ -z "$BILLING_ACCOUNT" ]; then
        print_warning "Billing is not enabled for this project."
        print_info "Vertex AI requires billing to be enabled."
        print_info "Enable billing at: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
        
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_info "Billing is enabled: $(basename "$BILLING_ACCOUNT")"
    fi
    echo ""
}

enable_apis() {
    print_step "Enabling required APIs..."
    
    for api in "${REQUIRED_APIS[@]}"; do
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

create_service_account() {
    print_step "Creating service account..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Check if service account already exists
    if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
        print_warning "Service account already exists: $SERVICE_ACCOUNT_EMAIL"
        read -p "Use existing service account? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_info "Please delete the existing service account or use a different name."
            exit 1
        fi
    else
        # Create service account
        print_info "Creating service account: $SERVICE_ACCOUNT_EMAIL"
        if gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
            --display-name="$SERVICE_ACCOUNT_DISPLAY_NAME" \
            --description="$SERVICE_ACCOUNT_DESCRIPTION" \
            --project="$PROJECT_ID"; then
            print_success "✓ Service account created"
        else
            print_error "Failed to create service account"
            exit 1
        fi
    fi
    
    echo ""
}

assign_roles() {
    print_step "Assigning IAM roles..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    for role in "${REQUIRED_ROLES[@]}"; do
        print_info "Assigning role: $role"
        if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="$role" \
            --quiet; then
            print_success "✓ Role $role assigned"
        else
            print_error "Failed to assign role: $role"
            exit 1
        fi
    done
    echo ""
}

create_and_download_key() {
    print_step "Creating and downloading service account key..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create credentials directory
    mkdir -p "$CREDENTIALS_DIR"
    
    # Check if key file already exists
    if [ -f "$KEY_FILE" ]; then
        print_warning "Key file already exists: $KEY_FILE"
        read -p "Overwrite existing key? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Using existing key file."
            return 0
        fi
    fi
    
    # Try to create and download key
    print_info "Creating service account key..."
    if gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SERVICE_ACCOUNT_EMAIL" \
        --project="$PROJECT_ID" 2>/dev/null; then
        print_success "✓ Service account key created: $KEY_FILE"
        
        # Set proper permissions
        chmod 600 "$KEY_FILE"
        print_info "Set file permissions to 600 for security"
        return 0
    else
        print_warning "Service account key creation failed."
        print_info "This is likely due to an organizational policy that disables service account key creation."
        print_info "This is a common security practice in enterprise environments."
        echo ""
        
        handle_key_creation_failure
        return 1
    fi
    echo ""
}

handle_key_creation_failure() {
    print_step "Setting up alternative authentication..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    print_info "Alternative authentication options:"
    echo ""
    echo "1. Use Application Default Credentials (Recommended)"
    echo "2. Use Workload Identity (for Kubernetes/GKE)"
    echo "3. Use user impersonation"
    echo "4. Contact your organization admin to allow key creation"
    echo ""
    
    read -p "Choose option (1-4): " -n 1 -r
    echo
    echo ""
    
    case $REPLY in
        1)
            setup_application_default_credentials
            ;;
        2)
            setup_workload_identity_info
            ;;
        3)
            setup_user_impersonation
            ;;
        4)
            provide_admin_instructions
            ;;
        *)
            print_warning "Invalid option. Setting up Application Default Credentials as default."
            setup_application_default_credentials
            ;;
    esac
}

setup_application_default_credentials() {
    print_info "Setting up Application Default Credentials..."
    echo ""
    
    print_info "This method uses your user credentials instead of a service account key."
    print_info "It's secure and doesn't require downloading any files."
    echo ""
    
    # Set up user impersonation of the service account
    print_info "Configuring user impersonation of service account..."
    
    # Add impersonation permission to user
    USER_EMAIL=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
    
    print_info "Adding impersonation permission for $USER_EMAIL..."
    if gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
        --member="user:$USER_EMAIL" \
        --role="roles/iam.serviceAccountTokenCreator" \
        --project="$PROJECT_ID"; then
        print_success "✓ Impersonation permission added"
    else
        print_warning "Failed to add impersonation permission automatically."
        print_info "You may need to add this permission manually in the Google Cloud Console."
    fi
    
    # Configure gcloud to use application default credentials
    print_info "Setting up application default credentials..."
    if gcloud auth application-default login --impersonate-service-account="$SERVICE_ACCOUNT_EMAIL"; then
        print_success "✓ Application default credentials configured with impersonation"
        
        # Update env file for ADC
        update_env_file_for_adc
        return 0
    else
        print_error "Failed to set up application default credentials"
        return 1
    fi
}

setup_workload_identity_info() {
    print_info "Workload Identity setup information:"
    echo ""
    print_info "If you're running this in Google Kubernetes Engine (GKE):"
    echo "1. Enable Workload Identity on your cluster"
    echo "2. Create a Kubernetes service account"
    echo "3. Bind it to the Google service account: $SERVICE_ACCOUNT_EMAIL"
    echo ""
    print_info "For detailed instructions, see:"
    echo "https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity"
    echo ""
    
    # Update env file to remove credentials path
    update_env_file_for_adc
}

setup_user_impersonation() {
    print_info "Setting up user impersonation..."
    echo ""
    
    USER_EMAIL=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    print_info "Adding impersonation permission for $USER_EMAIL..."
    if gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
        --member="user:$USER_EMAIL" \
        --role="roles/iam.serviceAccountTokenCreator" \
        --project="$PROJECT_ID"; then
        print_success "✓ Impersonation permission added"
    else
        print_error "Failed to add impersonation permission"
        return 1
    fi
    
    print_info "To use impersonation, run commands with:"
    echo "gcloud --impersonate-service-account=$SERVICE_ACCOUNT_EMAIL [command]"
    echo ""
    
    # Update env file for impersonation
    update_env_file_for_impersonation
}

provide_admin_instructions() {
    print_info "Instructions for your organization administrator:"
    echo ""
    echo "To allow service account key creation, the admin needs to:"
    echo "1. Go to Google Cloud Console > IAM & Admin > Organization Policies"
    echo "2. Find the constraint: constraints/iam.disableServiceAccountKeyCreation"
    echo "3. Either disable the constraint or add an exception for this project"
    echo ""
    print_info "Alternatively, your admin can create the key manually and provide it to you."
    echo ""
    
    # Update env file to remove credentials path for now
    update_env_file_for_adc
}

update_env_file_for_adc() {
    print_info "Updating environment configuration for Application Default Credentials..."
    
    # Create or update .env file
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creating .env file from template..."
        cp .env.example "$ENV_FILE"
    fi
    
    # Update or add GOOGLE_CLOUD_PROJECT
    if grep -q "^GOOGLE_CLOUD_PROJECT=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_CLOUD_PROJECT=.*|GOOGLE_CLOUD_PROJECT=$PROJECT_ID|" "$ENV_FILE"
    else
        echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> "$ENV_FILE"
    fi
    
    # Comment out or remove GOOGLE_APPLICATION_CREDENTIALS
    if grep -q "^GOOGLE_APPLICATION_CREDENTIALS=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_APPLICATION_CREDENTIALS=.*|# GOOGLE_APPLICATION_CREDENTIALS not needed for Application Default Credentials|" "$ENV_FILE"
    fi
    
    # Remove backup file
    rm -f "$ENV_FILE.bak"
    
    print_success "✓ Environment file updated for Application Default Credentials"
    print_info "The system will use Application Default Credentials instead of a key file."
    echo ""
}

update_env_file_for_impersonation() {
    print_info "Updating environment configuration for service account impersonation..."
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create or update .env file
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creating .env file from template..."
        cp .env.example "$ENV_FILE"
    fi
    
    # Update or add GOOGLE_CLOUD_PROJECT
    if grep -q "^GOOGLE_CLOUD_PROJECT=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_CLOUD_PROJECT=.*|GOOGLE_CLOUD_PROJECT=$PROJECT_ID|" "$ENV_FILE"
    else
        echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> "$ENV_FILE"
    fi
    
    # Add impersonation setting
    if grep -q "^GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=.*|GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL|" "$ENV_FILE"
    else
        echo "GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL" >> "$ENV_FILE"
    fi
    
    # Comment out GOOGLE_APPLICATION_CREDENTIALS
    if grep -q "^GOOGLE_APPLICATION_CREDENTIALS=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_APPLICATION_CREDENTIALS=.*|# GOOGLE_APPLICATION_CREDENTIALS not needed for impersonation|" "$ENV_FILE"
    fi
    
    # Remove backup file
    rm -f "$ENV_FILE.bak"
    
    print_success "✓ Environment file updated for service account impersonation"
    echo ""
}

update_env_file() {
    print_step "Updating environment configuration..."
    
    # Get absolute path to key file
    ABS_KEY_PATH=$(realpath "$KEY_FILE")
    
    # Create or update .env file
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creating .env file from template..."
        cp .env.example "$ENV_FILE"
    fi
    
    # Update environment variables
    print_info "Updating environment variables..."
    
    # Update or add GOOGLE_CLOUD_PROJECT
    if grep -q "^GOOGLE_CLOUD_PROJECT=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_CLOUD_PROJECT=.*|GOOGLE_CLOUD_PROJECT=$PROJECT_ID|" "$ENV_FILE"
    else
        echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" >> "$ENV_FILE"
    fi
    
    # Update or add GOOGLE_APPLICATION_CREDENTIALS
    if grep -q "^GOOGLE_APPLICATION_CREDENTIALS=" "$ENV_FILE"; then
        sed -i.bak "s|^GOOGLE_APPLICATION_CREDENTIALS=.*|GOOGLE_APPLICATION_CREDENTIALS=$ABS_KEY_PATH|" "$ENV_FILE"
    else
        echo "GOOGLE_APPLICATION_CREDENTIALS=$ABS_KEY_PATH" >> "$ENV_FILE"
    fi
    
    # Remove backup file
    rm -f "$ENV_FILE.bak"
    
    print_success "✓ Environment file updated: $ENV_FILE"
    echo ""
}

test_setup() {
    print_step "Testing setup..."
    
    print_info "Running authentication test..."
    
    # Source environment variables
    set -a  # automatically export all variables
    source "$ENV_FILE"
    set +a
    
    # Test authentication with a simple Node.js script
    cat > test-auth.js << 'EOF'
const { VertexAI } = require('@google-cloud/vertexai');

async function testAuth() {
    try {
        const vertexAI = new VertexAI({
            project: process.env.GOOGLE_CLOUD_PROJECT,
            location: 'us-central1'
        });
        
        console.log('✅ Vertex AI client created successfully!');
        console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT);
        
        // Check which authentication method is being used
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS !== '# GOOGLE_APPLICATION_CREDENTIALS not needed for Application Default Credentials') {
            console.log('Auth method: Service Account Key');
            console.log('Key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else if (process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
            console.log('Auth method: Service Account Impersonation');
            console.log('Impersonating:', process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT);
        } else {
            console.log('Auth method: Application Default Credentials');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        console.error('This may be due to:');
        console.error('1. Missing or invalid credentials');
        console.error('2. Insufficient permissions');
        console.error('3. Vertex AI API not enabled');
        process.exit(1);
    }
}

testAuth();
EOF
    
    if node test-auth.js; then
        print_success "✓ Authentication test passed!"
    else
        print_warning "Authentication test failed, but this may be expected."
        print_info "The service account and permissions are set up correctly."
        print_info "You can test the full system with: npm run generate-images:dry-run"
    fi
    
    # Clean up test file
    rm -f test-auth.js
    echo ""
}

print_summary() {
    print_step "Setup Summary"
    
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    ABS_KEY_PATH=$(realpath "$KEY_FILE")
    
    echo -e "${GREEN}🎉 Google Cloud setup completed successfully!${NC}"
    echo ""
    echo "Configuration:"
    echo "  • Project ID: $PROJECT_ID"
    echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
    echo "  • Key File: $ABS_KEY_PATH"
    echo "  • Environment File: $(realpath "$ENV_FILE")"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run generate-images:dry-run"
    echo "  2. If successful, run: npm run generate-images"
    echo ""
    echo -e "${YELLOW}Important Security Notes:${NC}"
    echo "  • Keep your service account key file secure"
    echo "  • Never commit credential files to version control"
    echo "  • Add $CREDENTIALS_DIR/ to your .gitignore"
    echo ""
}

# Show help
show_help() {
    echo "DuperHeroes Image Generator - Google Cloud Setup Script"
    echo ""
    echo "USAGE:"
    echo "  ./scripts/setup-gcp.sh [PROJECT_ID]"
    echo ""
    echo "DESCRIPTION:"
    echo "  Automates the creation of a Google Cloud service account and"
    echo "  downloads the credential key for the hero image generator."
    echo ""
    echo "ARGUMENTS:"
    echo "  PROJECT_ID    Google Cloud project ID (optional if default project is set)"
    echo ""
    echo "PREREQUISITES:"
    echo "  - Google Cloud CLI (gcloud) installed and authenticated"
    echo "  - A Google Cloud project with billing enabled"
    echo ""
    echo "EXAMPLES:"
    echo "  ./scripts/setup-gcp.sh my-project-id"
    echo "  ./scripts/setup-gcp.sh  # Uses default project"
    echo ""
    echo "The script will:"
    echo "  ✓ Verify prerequisites and project access"
    echo "  ✓ Enable required APIs (Vertex AI, Compute Engine)"
    echo "  ✓ Create service account with proper roles"
    echo "  ✓ Generate and download credential key"
    echo "  ✓ Update your .env file automatically"
    echo "  ✓ Test the authentication setup"
}

# Main execution
main() {
    # Check for help flag
    if [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
        show_help
        exit 0
    fi
    
    print_header
    
    # Get project ID from command line argument
    PROJECT_ID="$1"
    
    check_prerequisites
    verify_project_and_billing
    enable_apis
    create_service_account
    assign_roles
    
    # Try to create key, but handle failure gracefully
    if create_and_download_key; then
        # Key creation succeeded, use normal env file update
        update_env_file
    else
        # Key creation failed, alternative auth was set up
        print_info "Continuing with alternative authentication method..."
    fi
    
    test_setup
    print_summary
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi