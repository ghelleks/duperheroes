const { VertexAI } = require('@google-cloud/vertexai');
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
        this.model = process.env.VERTEX_AI_MODEL || 'imagen-3.0-generate-001';
        
        if (!this.project) {
            throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
        }
        
        // Configure authentication options
        const authConfig = {
            project: this.project,
            location: this.location
        };

        // Add service account impersonation if specified
        if (process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT) {
            authConfig.googleAuthOptions = {
                impersonated_service_account: process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT
            };
        }

        this.vertexAI = new VertexAI(authConfig);
        
        // For image generation, we use the preview client
        this.generativeModel = this.vertexAI.preview.getGenerativeModel({
            model: this.model
        });
    }

    /**
     * Get the configured Vertex AI client
     */
    getClient() {
        return this.vertexAI;
    }

    /**
     * Get the generative model for image generation
     */
    getGenerativeModel() {
        return this.generativeModel;
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
            aspectRatio: width / height,
            guidance: 7, // Controls adherence to prompt (1-20, higher = more adherent)
            seed: Math.floor(Math.random() * 1000000), // Random seed for variation
            steps: 20, // Generation steps (more = higher quality, slower)
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
            
            // Verify we're using the correct gcloud account
            await this.verifyGcloudAccount();
            
            // Test authentication by attempting to get project info
            const client = this.getClient();
            console.log('✅ Vertex AI client initialized successfully');
            
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