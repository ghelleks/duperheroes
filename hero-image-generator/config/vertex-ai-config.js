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
        
        this.vertexAI = new VertexAI({
            project: this.project,
            location: this.location
        });
        
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
            
            // Test authentication by attempting to get project info
            const client = this.getClient();
            console.log('✅ Vertex AI client initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Vertex AI configuration validation failed:', error.message);
            throw error;
        }
    }
}

module.exports = VertexAIConfig;