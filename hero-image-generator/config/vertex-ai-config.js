const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

/**
 * Vertex AI Configuration for Hero Image Generation
 * 
 * Handles authentication, client initialization, and API configuration
 * for Google Cloud Vertex AI image generation service.
 */

class VertexAIConfig {
    constructor() {
        this.project = process.env.GOOGLE_CLOUD_PROJECT;
        this.location = process.env.VERTEX_AI_REGION || 'us-central1';
        this.model = process.env.VERTEX_AI_MODEL || 'imagegeneration';
        
        if (!this.project) {
            throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
        }
        
        // Configure authentication with service account impersonation
        const authOptions = {
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        };

        // Add service account impersonation if specified
        if (process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
            authOptions.impersonated_service_account = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT;
        }

        this.auth = new GoogleAuth(authOptions);
        
        // Build the API endpoint
        this.endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.location}/publishers/google/models/${this.model}:predict`;
    }

    /**
     * Get the configured auth client
     */
    getAuthClient() {
        return this.auth;
    }

    /**
     * Get the API endpoint for image generation
     */
    getEndpoint() {
        return this.endpoint;
    }

    /**
     * Make an authenticated request to the Imagen API
     */
    async generateImage(prompt) {
        try {
            // Use gcloud auth to get access token with impersonation
            const { spawn } = require('child_process');
            const accessToken = await this.getGcloudAccessToken();
            
            const params = this.getImageGenerationParams();
            
            // Prepare request payload
            const payload = {
                instances: [
                    {
                        prompt: prompt
                    }
                ],
                parameters: {
                    sampleCount: 1
                }
            };

            // Make the API call
            const response = await axios.post(this.endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(`Image generation API call failed: ${error.message}`);
        }
    }

    /**
     * Get access token using gcloud with service account impersonation
     */
    async getGcloudAccessToken() {
        const { spawn } = require('child_process');
        
        return new Promise((resolve, reject) => {
            const args = ['auth', 'print-access-token'];
            
            // Add impersonation if configured
            if (process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
                args.push('--impersonate-service-account=' + process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT);
            }
            
            const gcloud = spawn('gcloud', args);
            let output = '';
            let error = '';
            
            gcloud.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            gcloud.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            gcloud.on('close', (code) => {
                if (code === 0) {
                    const token = output.trim();
                    resolve(token);
                } else {
                    reject(new Error(`Failed to get access token: ${error}`));
                }
            });
        });
    }

    /**
     * Get image generation parameters
     */
    getImageGenerationParams() {
        const size = process.env.IMAGE_OUTPUT_SIZE || '512x512';
        const [width, height] = size.split('x').map(Number);
        
        return {
            width: width,
            height: height,
            aspectRatio: `${width}:${height}`, // Imagen expects aspect ratio as string like "1:1"
            guidance: 7, // Controls adherence to prompt
            seed: Math.floor(Math.random() * 1000000), // Random seed for variation
            format: process.env.IMAGE_FORMAT || 'png'
        };
    }

    /**
     * Get rate limiting configuration
     */
    getRateLimitConfig() {
        return {
            batchSize: parseInt(process.env.BATCH_SIZE) || 5,
            delayMs: parseInt(process.env.RATE_LIMIT_DELAY) || 2000,
            maxRetries: parseInt(process.env.MAX_RETRIES) || 3
        };
    }

    /**
     * Validate configuration and test connection
     */
    async validateConfig() {
        try {
            console.log('🔧 Validating Vertex AI configuration...');
            console.log(`  Project: ${this.project}`);
            console.log(`  Location: ${this.location}`);
            console.log(`  Model: ${this.model}`);
            console.log(`  Endpoint: ${this.endpoint}`);
            
            // Verify we're using the correct gcloud account
            await this.verifyGcloudAccount();
            
            // Test authentication by getting access token
            const accessToken = await this.getGcloudAccessToken();
            console.log('✅ Authentication successful - access token obtained');
            
            return true;
        } catch (error) {
            console.error('❌ Vertex AI configuration validation failed:', error.message);
            throw error;
        }
    }

    /**
     * Verify that we're using the correct gcloud account
     */
    async verifyGcloudAccount() {
        const { spawn } = require('child_process');
        
        return new Promise((resolve, reject) => {
            const gcloud = spawn('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']);
            let output = '';
            
            gcloud.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            gcloud.on('close', (code) => {
                if (code === 0) {
                    const activeAccount = output.trim();
                    const requiredAccount = process.env.REQUIRED_GCLOUD_ACCOUNT || 'gunnar@hellekson.com';
                    
                    if (activeAccount === requiredAccount) {
                        console.log(`✅ Verified gcloud account: ${activeAccount}`);
                        resolve();
                    } else {
                        const error = new Error(
                            `❌ SECURITY ERROR: Image generation must run as '${requiredAccount}' but currently authenticated as '${activeAccount}'. ` +
                            `Run: gcloud config set account ${requiredAccount}`
                        );
                        reject(error);
                    }
                } else {
                    reject(new Error('Failed to check gcloud authentication'));
                }
            });
        });
    }
}

module.exports = VertexAIConfig;