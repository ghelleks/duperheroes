#!/usr/bin/env node

/**
 * Hero Image Generator
 * 
 * Main pipeline for generating superhero images using Google Vertex AI.
 * Integrates with the existing DuperHeroes audit system to identify
 * missing images and generate them using AI.
 */

const path = require('path');
require('dotenv').config();

// Import our modules
const VertexAIConfig = require('../config/vertex-ai-config');
const PromptTemplate = require('./prompt-template');
const FileUtils = require('./utils/file-utils');
const { generateHeroSlug, generateImageFilename, generateImagePath } = require('./utils/slug-utils');

// Import audit system
const auditSystem = require('../../scripts/audit-images');

class HeroImageGenerator {
    constructor(options = {}) {
        this.options = {
            dryRun: options.dryRun || process.env.DRY_RUN === 'true',
            batchSize: options.batchSize || parseInt(process.env.BATCH_SIZE) || 5,
            delayMs: options.delayMs || parseInt(process.env.RATE_LIMIT_DELAY) || 2000,
            maxRetries: options.maxRetries || parseInt(process.env.MAX_RETRIES) || 3,
            verbose: options.verbose || process.env.VERBOSE_LOGGING === 'true',
            outputFormat: options.outputFormat || process.env.IMAGE_FORMAT || 'png'
        };
        
        this.vertexAI = null;
        this.promptTemplate = new PromptTemplate();
        this.fileUtils = new FileUtils();
        this.stats = {
            totalHeroes: 0,
            missingImages: 0,
            generated: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };
        this.logs = [];
    }

    /**
     * Initialize the generator
     */
    async initialize() {
        try {
            this.log('🚀 Initializing Hero Image Generator...');
            
            // Initialize Vertex AI configuration
            this.vertexAI = new VertexAIConfig();
            await this.vertexAI.validateConfig();
            
            // Setup file utilities
            this.fileUtils.ensureOutputDirectory();
            this.fileUtils.ensureDebugDirectory();
            
            this.log('✅ Generator initialized successfully');
            return true;
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get heroes that need images
     */
    async getHeroesNeedingImages() {
        try {
            this.log('📋 Analyzing heroes database for missing images...');
            
            // Use existing audit system
            const auditResults = auditSystem.performAudit();
            
            this.stats.totalHeroes = auditResults.stats.totalHeroes;
            this.stats.missingImages = auditResults.stats.heroesWithoutImages;
            
            this.log(`📊 Found ${this.stats.totalHeroes} total heroes`);
            this.log(`🎯 ${this.stats.missingImages} heroes need images`);
            
            return auditResults.heroesWithoutImages;
        } catch (error) {
            this.log(`❌ Error analyzing heroes: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate image for a single hero
     */
    async generateHeroImage(heroData) {
        const hero = heroData.hero;
        const slug = heroData.slug;
        
        try {
            this.log(`🎨 Generating image for ${hero.superhero_name}...`);
            
            // Check if image already exists (safety check)
            const filename = generateImageFilename(hero, this.options.outputFormat);
            if (this.fileUtils.imageExists(filename)) {
                this.log(`⏭️  Image already exists for ${hero.superhero_name}, skipping`);
                this.stats.skipped++;
                return { success: true, skipped: true };
            }
            
            // Generate prompt
            const promptData = this.promptTemplate.generatePrompt(hero);
            
            if (this.options.verbose) {
                this.log(`📝 Prompt: ${promptData.prompt.substring(0, 200)}...`);
            }
            
            // Generate image (or simulate in dry run mode)
            let imageResult;
            if (this.options.dryRun) {
                this.log(`🧪 [DRY RUN] Would generate image for ${hero.superhero_name}`);
                imageResult = { success: true, dryRun: true };
            } else {
                imageResult = await this.callVertexAI(promptData);
            }
            
            if (imageResult.success) {
                // Save image (or simulate)
                let saveResult;
                if (this.options.dryRun) {
                    saveResult = { success: true, dryRun: true };
                } else {
                    saveResult = await this.fileUtils.saveImage(imageResult.imageData, filename);
                }
                
                if (saveResult.success) {
                    this.stats.generated++;
                    this.log(`✅ Generated image for ${hero.superhero_name}`);
                    
                    return {
                        success: true,
                        hero: hero,
                        slug: slug,
                        filename: filename,
                        imagePath: generateImagePath(hero, this.options.outputFormat),
                        prompt: promptData.prompt,
                        dryRun: this.options.dryRun
                    };
                } else {
                    throw new Error(`Failed to save image: ${saveResult.error}`);
                }
            } else {
                throw new Error(`Image generation failed: ${imageResult.error}`);
            }
            
        } catch (error) {
            this.stats.failed++;
            this.stats.errors.push({
                hero: hero.superhero_name,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.log(`❌ Failed to generate image for ${hero.superhero_name}: ${error.message}`);
            
            return {
                success: false,
                hero: hero,
                error: error.message
            };
        }
    }

    /**
     * Call Vertex AI to generate image
     */
    async callVertexAI(promptData) {
        try {
            const model = this.vertexAI.getGenerativeModel();
            const params = this.vertexAI.getImageGenerationParams();
            
            // Prepare the request
            const request = {
                prompt: promptData.prompt,
                negativePrompt: promptData.negativePrompt,
                ...params
            };
            
            if (this.options.verbose) {
                this.log(`🔧 Vertex AI request parameters: ${JSON.stringify(params, null, 2)}`);
            }
            
            // Make the API call
            const response = await model.generateContent(request);
            
            // Extract image data from response
            if (response && response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];
                
                // Handle different response formats
                let imageData;
                if (candidate.content && candidate.content.parts) {
                    // Look for image data in parts
                    const imagePart = candidate.content.parts.find(part => 
                        part.inlineData && part.inlineData.mimeType.startsWith('image/')
                    );
                    
                    if (imagePart) {
                        imageData = imagePart.inlineData.data;
                    }
                } else if (candidate.image) {
                    imageData = candidate.image;
                } else {
                    throw new Error('No image data found in response');
                }
                
                return {
                    success: true,
                    imageData: imageData,
                    metadata: promptData.metadata
                };
            } else {
                throw new Error('Invalid response format from Vertex AI');
            }
            
        } catch (error) {
            this.log(`❌ Vertex AI API error: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate images in batches with rate limiting
     */
    async generateImages(heroesNeedingImages) {
        this.log(`🔄 Starting batch generation for ${heroesNeedingImages.length} heroes...`);
        this.log(`📋 Batch size setting: ${this.options.batchSize}`);
        
        const results = [];
        const batchSize = this.options.batchSize;
        
        for (let i = 0; i < heroesNeedingImages.length; i += batchSize) {
            const batch = heroesNeedingImages.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(heroesNeedingImages.length / batchSize);
            
            this.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} heroes)`);
            
            // Process batch
            const batchPromises = batch.map(heroData => this.generateHeroImage(heroData));
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Collect results
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    this.stats.failed++;
                    this.stats.errors.push({
                        error: result.reason.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Rate limiting delay between batches
            if (i + batchSize < heroesNeedingImages.length) {
                this.log(`⏳ Waiting ${this.options.delayMs}ms before next batch...`);
                await this.delay(this.options.delayMs);
            }
        }
        
        return results;
    }

    /**
     * Update heroes.json with generated image paths
     */
    async updateHeroesDatabase(generatedImages) {
        if (this.options.dryRun) {
            this.log('🧪 [DRY RUN] Would update heroes.json with image paths');
            return true;
        }
        
        try {
            this.log('📝 Updating heroes.json with generated image paths...');
            
            // Load current heroes data
            const heroesPath = path.resolve(__dirname, '../../public/heroes.json');
            const heroesData = JSON.parse(require('fs').readFileSync(heroesPath, 'utf8'));
            
            let updatedCount = 0;
            
            // Update imagePath for generated heroes
            for (const result of generatedImages) {
                if (result.success && !result.skipped) {
                    const hero = heroesData.heroes.find(h => 
                        h.superhero_name === result.hero.superhero_name
                    );
                    
                    if (hero) {
                        hero.imagePath = result.imagePath;
                        updatedCount++;
                    }
                }
            }
            
            // Save updated data
            require('fs').writeFileSync(heroesPath, JSON.stringify(heroesData, null, 2));
            
            this.log(`✅ Updated ${updatedCount} hero records with image paths`);
            return true;
        } catch (error) {
            this.log(`❌ Error updating heroes database: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate final report
     */
    generateReport() {
        const report = {
            summary: {
                totalHeroes: this.stats.totalHeroes,
                missingImages: this.stats.missingImages,
                generated: this.stats.generated,
                skipped: this.stats.skipped,
                failed: this.stats.failed,
                successRate: this.stats.missingImages > 0 ? 
                    Math.round((this.stats.generated / this.stats.missingImages) * 100) : 0
            },
            errors: this.stats.errors,
            logs: this.logs,
            options: this.options,
            timestamp: new Date().toISOString()
        };
        
        // Save debug output
        this.fileUtils.saveDebugOutput(report);
        
        return report;
    }

    /**
     * Display results summary
     */
    displaySummary() {
        console.log('\n🎯 HERO IMAGE GENERATION SUMMARY');
        console.log('=================================');
        console.log(`Total Heroes: ${this.stats.totalHeroes}`);
        console.log(`Missing Images: ${this.stats.missingImages}`);
        console.log(`Successfully Generated: ${this.stats.generated}`);
        console.log(`Skipped (already exist): ${this.stats.skipped}`);
        console.log(`Failed: ${this.stats.failed}`);
        
        if (this.stats.missingImages > 0) {
            const successRate = Math.round((this.stats.generated / this.stats.missingImages) * 100);
            console.log(`Success Rate: ${successRate}%`);
        }
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            for (const error of this.stats.errors) {
                console.log(`  ${error.hero || 'Unknown'}: ${error.error}`);
            }
        }
        
        const imageStats = this.fileUtils.calculateTotalImageSize();
        console.log(`\n📊 Image Storage: ${imageStats.count} files, ${imageStats.totalFormatted} total`);
        
        if (this.options.dryRun) {
            console.log('\n🧪 DRY RUN MODE - No actual images were generated');
        }
    }

    /**
     * Utility functions
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.logs.push(logMessage);
    }

    /**
     * Main execution function
     */
    async run() {
        try {
            // Initialize
            await this.initialize();
            
            // Get heroes needing images
            const heroesNeedingImages = await this.getHeroesNeedingImages();
            
            if (heroesNeedingImages.length === 0) {
                this.log('🎉 All heroes already have images!');
                return;
            }
            
            // Generate images
            const results = await this.generateImages(heroesNeedingImages);
            
            // Update database
            await this.updateHeroesDatabase(results);
            
            // Generate report and display summary
            this.generateReport();
            this.displaySummary();
            
            // Clean up old debug files
            this.fileUtils.cleanupOldDebugFiles();
            
            this.log('✅ Hero image generation completed successfully');
            
        } catch (error) {
            this.log(`❌ Fatal error: ${error.message}`);
            this.generateReport();
            process.exit(1);
        }
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (const arg of args) {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--verbose') {
            options.verbose = true;
        } else if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
            console.log(`[DEBUG] Setting batch size to: ${options.batchSize}`);
        } else if (arg.startsWith('--format=')) {
            options.outputFormat = arg.split('=')[1];
        }
    }
    
    // Create and run generator
    const generator = new HeroImageGenerator(options);
    await generator.run();
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = HeroImageGenerator;