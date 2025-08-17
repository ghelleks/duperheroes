const fs = require('fs');
const path = require('path');

/**
 * File Operations Utilities
 * 
 * Handles all file system operations for image generation,
 * including saving images, validating paths, and managing directories.
 */

class FileUtils {
    constructor(outputDir = '../public/images') {
        this.outputDir = path.resolve(__dirname, outputDir);
        this.debugDir = path.resolve(__dirname, '../public/debug');
        this.supportedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    }

    /**
     * Ensure output directory exists
     */
    ensureOutputDirectory() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
                console.log(`📁 Created output directory: ${this.outputDir}`);
            }
            return true;
        } catch (error) {
            console.error(`❌ Error creating output directory: ${error.message}`);
            return false;
        }
    }

    /**
     * Ensure debug directory exists
     */
    ensureDebugDirectory() {
        try {
            if (!fs.existsSync(this.debugDir)) {
                fs.mkdirSync(this.debugDir, { recursive: true });
                console.log(`📁 Created debug directory: ${this.debugDir}`);
            }
            return true;
        } catch (error) {
            console.error(`❌ Error creating debug directory: ${error.message}`);
            return false;
        }
    }

    /**
     * Save image data to file
     */
    async saveImage(imageData, filename) {
        try {
            this.ensureOutputDirectory();
            
            const filePath = path.join(this.outputDir, filename);
            
            // Handle different image data formats
            let buffer;
            if (Buffer.isBuffer(imageData)) {
                buffer = imageData;
            } else if (typeof imageData === 'string') {
                // Base64 encoded data
                const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                throw new Error('Unsupported image data format');
            }
            
            fs.writeFileSync(filePath, buffer);
            
            const stats = fs.statSync(filePath);
            console.log(`💾 Saved image: ${filename} (${this.formatBytes(stats.size)})`);
            
            return {
                success: true,
                filePath: filePath,
                relativePath: `./images/${filename}`,
                size: stats.size
            };
            
        } catch (error) {
            console.error(`❌ Error saving image ${filename}: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if image file already exists
     */
    imageExists(filename) {
        const filePath = path.join(this.outputDir, filename);
        return fs.existsSync(filePath);
    }

    /**
     * Get existing image info
     */
    getImageInfo(filename) {
        try {
            const filePath = path.join(this.outputDir, filename);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            const stats = fs.statSync(filePath);
            return {
                filename: filename,
                filePath: filePath,
                relativePath: `./images/${filename}`,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            console.error(`❌ Error getting image info for ${filename}: ${error.message}`);
            return null;
        }
    }

    /**
     * Scan output directory for existing images
     */
    scanExistingImages() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                return [];
            }
            
            const files = fs.readdirSync(this.outputDir);
            const images = [];
            
            for (const file of files) {
                const ext = path.extname(file).toLowerCase().substring(1);
                if (this.supportedExtensions.includes(ext)) {
                    const info = this.getImageInfo(file);
                    if (info) {
                        images.push(info);
                    }
                }
            }
            
            return images;
        } catch (error) {
            console.error(`❌ Error scanning existing images: ${error.message}`);
            return [];
        }
    }

    /**
     * Save debug output
     */
    saveDebugOutput(data, filename = 'image-generation.json') {
        try {
            this.ensureDebugDirectory();
            
            const debugData = {
                timestamp: new Date().toISOString(),
                ...data
            };
            
            const filePath = path.join(this.debugDir, filename);
            fs.writeFileSync(filePath, JSON.stringify(debugData, null, 2));
            
            console.log(`📄 Debug output saved: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ Error saving debug output: ${error.message}`);
            return false;
        }
    }

    /**
     * Load existing debug output
     */
    loadDebugOutput(filename = 'image-generation.json') {
        try {
            const filePath = path.join(this.debugDir, filename);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data;
        } catch (error) {
            console.error(`❌ Error loading debug output: ${error.message}`);
            return null;
        }
    }

    /**
     * Validate filename format
     */
    validateFilename(filename) {
        // Check for valid characters and extension
        const validPattern = /^[a-z0-9-]+\.(png|jpg|jpeg|webp|gif|svg)$/i;
        return validPattern.test(filename);
    }

    /**
     * Clean filename (remove invalid characters)
     */
    cleanFilename(filename) {
        // Remove or replace invalid characters
        return filename
            .toLowerCase()
            .replace(/[^a-z0-9.-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get safe filename for hero
     */
    getSafeFilename(heroName, extension = 'png') {
        const safeName = heroName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        return `${safeName}.${extension}`;
    }

    /**
     * Format bytes for human reading
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Calculate total size of generated images
     */
    calculateTotalImageSize() {
        const images = this.scanExistingImages();
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        return {
            count: images.length,
            totalBytes: totalSize,
            totalFormatted: this.formatBytes(totalSize),
            averageSize: images.length > 0 ? Math.round(totalSize / images.length) : 0
        };
    }

    /**
     * Cleanup old debug files
     */
    cleanupOldDebugFiles(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        try {
            if (!fs.existsSync(this.debugDir)) {
                return 0;
            }
            
            const files = fs.readdirSync(this.debugDir);
            let cleanedCount = 0;
            const now = Date.now();
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.debugDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (now - stats.mtime.getTime() > maxAge) {
                        fs.unlinkSync(filePath);
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned up ${cleanedCount} old debug files`);
            }
            
            return cleanedCount;
        } catch (error) {
            console.error(`❌ Error cleaning up debug files: ${error.message}`);
            return 0;
        }
    }
}

module.exports = FileUtils;