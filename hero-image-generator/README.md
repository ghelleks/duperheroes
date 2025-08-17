# Hero Image Generator

AI-powered image generation system for DuperHeroes using Google Vertex AI. This system automatically generates cartoon-style superhero images for characters missing visuals in the game database.

## Overview

The Hero Image Generator integrates with the existing DuperHeroes audit system to:
- Identify heroes without images (currently 163 out of 194 heroes)
- Generate high-quality cartoon-style superhero images using Google Vertex AI
- Save images with proper filenames in the `public/images/` directory
- Update the `heroes.json` database with image paths
- Provide comprehensive logging and error handling

## Features

- **AI-Powered Generation**: Uses Google Vertex AI's Imagen model for high-quality image generation
- **Smart Prompting**: Dynamic prompt templates incorporating hero data (powers, animal themes, origin stories)
- **Batch Processing**: Configurable batch sizes with rate limiting to respect API limits
- **Error Handling**: Comprehensive retry logic and error reporting
- **Integration**: Seamless integration with existing audit and build systems
- **Dry Run Mode**: Test the system without generating actual images or making changes
- **Debug Output**: Detailed logging and debug information saved for monitoring

## Prerequisites

### Google Cloud Setup

1. **Google Cloud Project**: You need a Google Cloud project with Vertex AI API enabled
2. **Authentication**: Either service account key or Application Default Credentials
3. **Permissions**: Vertex AI User role or equivalent permissions

### Environment Setup

1. **Node.js**: Version 18.0.0 or higher
2. **npm**: Version 9.0.0 or higher

## Installation

1. **Install Dependencies**:
   ```bash
   cd hero-image-generator
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Google Cloud settings
   ```

3. **Set up Google Cloud Authentication** (detailed instructions below)

## Quick Setup Checklist

### ⚡ Fastest Setup (Automated)
```bash
# 1. Install Google Cloud CLI and authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Run automated setup script
cd hero-image-generator
./scripts/setup-gcp.sh YOUR_PROJECT_ID

# 3. Test and generate images
npm run generate-images:dry-run
npm run generate-images
```

### 📋 Manual Setup Checklist

If using manual setup, ensure you have:

- [ ] **Google Cloud Project** created with billing enabled
- [ ] **Vertex AI API** enabled in your project
- [ ] **Service Account** created with proper roles:
  - [ ] `Vertex AI User`
  - [ ] `AI Platform Developer` 
- [ ] **Service Account Key** downloaded (JSON format)
- [ ] **Environment file** configured with credentials
- [ ] **Dependencies** installed (`npm install`)
- [ ] **Authentication** tested (run verification command below)

**Quick Test**: Run this to verify your setup:
```bash
cd hero-image-generator
npm run generate-images:dry-run
```

If successful, you'll see "✅ Vertex AI client initialized successfully"

## Google Cloud Setup & Authentication

You can set up Google Cloud either **automatically** with our setup script or **manually** following the detailed steps below.

### Option 1: Automated Setup (Recommended)

Use the provided script to automatically create the service account and configure authentication:

```bash
# Prerequisites: gcloud CLI installed and authenticated
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Run the automated setup script
cd hero-image-generator
./scripts/setup-gcp.sh YOUR_PROJECT_ID
```

The script will:
- ✅ Verify prerequisites and project access
- ✅ Enable required APIs (Vertex AI, Compute Engine)
- ✅ Create service account with proper roles
- ✅ Generate and download credential key
- ✅ Update your `.env` file automatically
- ✅ Test the authentication setup

**Prerequisites for automated setup**:
- Google Cloud CLI (`gcloud`) installed: https://cloud.google.com/sdk/docs/install
- Authenticated with Google Cloud: `gcloud auth login`
- Project with billing enabled

If the script succeeds, you can skip to the [Usage](#usage) section!

### Option 2: Manual Setup

If you prefer manual setup or the script doesn't work, follow these detailed steps:

### Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one:
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Enter project name (e.g., "duperheroes-image-gen")
   - Note the **Project ID** (you'll need this)

### Step 2: Enable Vertex AI API

1. **Navigate to APIs & Services** > **Library**
2. **Search for "Vertex AI API"**
3. **Click "Enable"** (may take a few minutes)
4. Alternatively, use this direct link: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

### Step 3: Set up Authentication

You have two options for authentication. **Option A (Service Account)** is recommended for production use.

#### Option A: Service Account Key (Recommended)

1. **Navigate to IAM & Admin** > **Service Accounts**:
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create a Service Account**:
   - Click "Create Service Account"
   - **Service account name**: `hero-image-generator`
   - **Service account ID**: `hero-image-generator` (auto-filled)
   - **Description**: `Service account for DuperHeroes image generation`
   - Click "Create and Continue"

3. **Grant Required Roles**:
   - **Role 1**: `Vertex AI User` (allows using Vertex AI APIs)
   - **Role 2**: `AI Platform Developer` (additional permissions for image generation)
   - Click "Continue", then "Done"

4. **Create and Download Key**:
   - Click on your newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Click "Create"
   - **Save the downloaded JSON file securely** (e.g., `~/credentials/duperheroes-service-account.json`)

5. **Set Environment Variable**:
   ```bash
   # In your .env file:
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   ```

#### Option B: Application Default Credentials

1. **Install Google Cloud CLI**: https://cloud.google.com/sdk/docs/install

2. **Initialize and Authenticate**:
   ```bash
   # Initialize gcloud (one-time setup)
   gcloud init
   
   # Authenticate for application default credentials
   gcloud auth application-default login
   
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Verify Authentication**:
   ```bash
   gcloud auth application-default print-access-token
   ```

### Step 4: Configure Billing (Required)

⚠️ **Important**: Vertex AI requires a billing account even for small usage.

1. **Go to Billing**: https://console.cloud.google.com/billing
2. **Link a billing account** to your project
3. **Set up budget alerts** (recommended):
   - Go to "Budgets & alerts"
   - Create budget with $10-20 limit
   - Set alerts at 50%, 90%, 100%

### Step 5: Verify Access

Test your setup with this command:
```bash
# From the hero-image-generator directory
node -e "
const { VertexAI } = require('@google-cloud/vertexai');
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1'
});
console.log('✅ Vertex AI client created successfully!');
console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT);
"
```

## Configuration

### Environment Variables

Create a `.env` file in the `hero-image-generator` directory:

```env
# Required
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_AI_REGION=us-central1

# Authentication (choose one)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Optional Settings
VERTEX_AI_MODEL=imagen-3.0-generate-001
IMAGE_OUTPUT_SIZE=512x512
IMAGE_FORMAT=png
BATCH_SIZE=5
RATE_LIMIT_DELAY=2000
MAX_RETRIES=3
DRY_RUN=false
VERBOSE_LOGGING=true
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | *required* | Your Google Cloud project ID |
| `VERTEX_AI_REGION` | `us-central1` | Vertex AI service region |
| `VERTEX_AI_MODEL` | `imagen-3.0-generate-001` | Image generation model |
| `IMAGE_OUTPUT_SIZE` | `512x512` | Generated image dimensions |
| `IMAGE_FORMAT` | `png` | Output image format |
| `BATCH_SIZE` | `5` | Number of images to generate concurrently |
| `RATE_LIMIT_DELAY` | `2000` | Delay between batches (milliseconds) |
| `MAX_RETRIES` | `3` | Maximum retry attempts for failed generations |
| `DRY_RUN` | `false` | Test mode without actual generation |
| `VERBOSE_LOGGING` | `true` | Detailed logging output |

## Usage

### Quick Start

```bash
# From the project root directory
npm run generate-images
```

### Available Scripts

From the **project root**:

```bash
# Generate missing hero images
npm run generate-images

# Test run without generating images
npm run generate-images:dry-run

# Generate with verbose output
npm run generate-images:verbose

# Full pipeline: audit + generate
npm run build-images

# Full pipeline in dry-run mode
npm run build-images:dry-run
```

From the **hero-image-generator directory**:

```bash
# Direct execution
node src/image-generator.js

# With options
node src/image-generator.js --dry-run --verbose --batch-size=3

# Test single generation
npm run test
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Simulate generation without creating files |
| `--verbose` | Enable detailed logging |
| `--batch-size=N` | Override batch size |
| `--format=png` | Override output format |

## How It Works

### 1. Hero Analysis
- Integrates with existing `scripts/audit-images.js`
- Identifies heroes without images (163 currently)
- Uses same slug generation logic for consistency

### 2. Prompt Generation
- Creates detailed prompts from hero data:
  - Superhero name and animal theme
  - Powers and origin story
  - Marvel character inspiration
  - Visual style guidelines
- Ensures consistent cartoon/comic book style
- Incorporates animal-specific traits and colors

### 3. Image Generation
- Calls Google Vertex AI Imagen API
- Applies rate limiting and retry logic
- Generates 512x512 PNG images by default
- Handles errors gracefully with detailed logging

### 4. File Management
- Saves images with correct slug-based filenames
- Updates `heroes.json` with `imagePath` references
- Creates debug output for monitoring
- Maintains file system consistency

### 5. Integration
- Works with existing build pipeline
- Provides comprehensive reporting
- Integrates with debug page system

## Example Prompt

For "Captain Canine" (Dog-themed Captain America parody):

```
A superhero named Captain Canine, loyal canine features, pointed ears, friendly expression, displaying their unique superhero abilities, patriotic stars and stripes design, brown, gold, and blue color scheme, heroic standing pose with confident expression, city park or urban setting, high-quality digital art, cartoon style, superhero comic book art, vibrant colors, dynamic pose, professional illustration, full body character illustration, centered composition, clean background, 512x512 resolution, trending on artstation, detailed, masterpiece, best quality
```

## Output

### Generated Files
- **Images**: Saved to `public/images/` with slug-based filenames
- **Database**: `heroes.json` updated with `imagePath` fields
- **Debug Info**: `public/debug/image-generation.json` with detailed logs

### Example Output Structure
```
public/
├── images/
│   ├── captain-canine.png
│   ├── spider-swinger.png
│   └── ...
├── heroes.json (updated with imagePaths)
└── debug/
    └── image-generation.json
```

## Monitoring and Debugging

### Debug Output
The system creates comprehensive debug output at `public/debug/image-generation.json`:

```json
{
  "timestamp": "2024-01-17T10:30:00.000Z",
  "summary": {
    "totalHeroes": 194,
    "missingImages": 163,
    "generated": 158,
    "failed": 5,
    "successRate": 97
  },
  "errors": [...],
  "logs": [...],
  "options": {...}
}
```

### Logging
- Real-time console output with timestamps
- Detailed error messages with hero context
- Progress tracking for batch operations
- Performance metrics and statistics

### Error Handling
- Individual hero failures don't stop batch processing
- Automatic retry with exponential backoff
- Detailed error collection and reporting
- Graceful degradation for API issues

## Integration with Build Process

The generator integrates seamlessly with the existing DuperHeroes build system:

1. **Audit Phase**: `npm run audit-images` identifies missing images
2. **Generation Phase**: `npm run generate-images` creates missing images
3. **Validation Phase**: Re-run audit to verify results
4. **Deployment**: Standard GitHub Pages deployment includes new images

### CI/CD Integration
```yaml
# Example GitHub Actions step
- name: Generate Hero Images
  run: |
    npm run build-images:dry-run  # Test first
    npm run build-images          # Generate if test passes
  env:
    GOOGLE_CLOUD_PROJECT: ${{ secrets.GCP_PROJECT }}
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

## Cost Considerations

### API Costs
- Vertex AI Imagen charges per generated image
- Batch processing optimizes API usage
- Rate limiting prevents unexpected costs
- Dry-run mode for testing without charges

### Cost Estimates (approximate)
- 163 missing images × $0.04 per image = ~$6.50 total
- One-time generation cost
- No ongoing costs for existing images

## Troubleshooting

### Authentication Issues

**Error: Could not load the default credentials**
```bash
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

**Solutions**:
1. **Check .env file**: Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to correct JSON file
2. **Verify file exists**: `ls -la /path/to/your/service-account-key.json`
3. **Check file permissions**: `chmod 600 /path/to/your/service-account-key.json`
4. **Test authentication**:
   ```bash
   # Load environment and test
   source .env
   gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
   ```

**Error: Permission denied**
```bash
Error: User does not have permission to access project
```

**Solutions**:
1. **Verify project ID**: Check `GOOGLE_CLOUD_PROJECT` in .env matches your actual project
2. **Check service account roles**:
   - Go to IAM & Admin > IAM in Google Cloud Console
   - Find your service account email
   - Ensure it has "Vertex AI User" role
3. **Re-create service account** with correct permissions

**Error: API not enabled**
```bash
Error: Vertex AI API has not been used in project before or it is disabled
```

**Solutions**:
1. **Enable Vertex AI API**:
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
   ```
2. **Or enable via Console**: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

**Error: Billing account required**
```bash
Error: Project does not have billing enabled
```

**Solutions**:
1. **Link billing account** in Google Cloud Console
2. **Verify billing is enabled**: https://console.cloud.google.com/billing
3. **Check billing account permissions**: You need "Billing Account User" role

**Error: Key creation not allowed**
```bash
ERROR: Key creation is not allowed on this service account.
constraints/iam.disableServiceAccountKeyCreation
```

**Solutions**:
This is a common organizational security policy. The script will automatically handle this and offer alternatives:

1. **Application Default Credentials** (Recommended): Uses your user credentials with service account impersonation
2. **Workload Identity**: For Kubernetes/GKE environments
3. **Manual impersonation**: For advanced use cases
4. **Contact admin**: Request policy exception

The automated script handles this gracefully and sets up the alternative authentication automatically.

**API Quota Exceeded**
```bash
Error: Quota exceeded for quota group
```
- Reduce `BATCH_SIZE` in environment
- Increase `RATE_LIMIT_DELAY`
- Check Vertex AI quotas in Google Cloud Console

**File Permission Errors**
```bash
Error: EACCES: permission denied
```
- Check write permissions on `public/images/` directory
- Verify Node.js process has file system access

**Invalid Model Response**
```bash
Error: No image data found in response
```
- Verify Vertex AI API is enabled
- Check model availability in your region
- Review prompt length and content

### Debug Mode
```bash
# Run with maximum debugging
npm run generate-images:verbose

# Check debug output
cat public/debug/image-generation.json | jq .
```

## Development

### Testing
```bash
# Test prompt generation
cd hero-image-generator
node -e "
const PromptTemplate = require('./src/prompt-template');
const pt = new PromptTemplate();
console.log(JSON.stringify(pt.generateTestPrompt(), null, 2));
"

# Test file operations
node -e "
const FileUtils = require('./src/utils/file-utils');
const fu = new FileUtils();
console.log(fu.calculateTotalImageSize());
"
```

### Extending the System

**Custom Prompt Templates**
- Modify `src/prompt-template.js`
- Add new animal themes or visual styles
- Customize prompt generation logic

**Different Output Formats**
- Update `IMAGE_FORMAT` environment variable
- Modify file extension handling in utilities
- Adjust Vertex AI parameters

**Batch Processing**
- Modify `BATCH_SIZE` for different throughput
- Adjust `RATE_LIMIT_DELAY` for API limits
- Customize retry logic in main generator

## Architecture

```
hero-image-generator/
├── config/
│   └── vertex-ai-config.js     # API configuration
├── src/
│   ├── image-generator.js      # Main pipeline
│   ├── prompt-template.js      # Prompt generation
│   └── utils/
│       ├── file-utils.js       # File operations
│       └── slug-utils.js       # Naming consistency
├── package.json                # Dependencies
├── .env.example               # Configuration template
└── README.md                  # This file
```

## License

MIT License - same as the main DuperHeroes project.

## Support

For issues or questions:
1. Check this README for common solutions
2. Review debug output in `public/debug/image-generation.json`
3. Run with `--verbose` flag for detailed logging
4. Open an issue in the main DuperHeroes repository