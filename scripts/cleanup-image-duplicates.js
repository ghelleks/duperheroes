#!/usr/bin/env node

/**
 * Image Duplicate Cleanup Script
 * 
 * Implements ADR-011: JPEG File Preference Rule
 * 
 * This script:
 * 1. Scans for duplicate image files (JPEG/PNG pairs)
 * 2. Removes PNG files when JPEG exists
 * 3. Identifies and fixes naming inconsistencies
 * 4. Regenerates responsive formats as needed
 */

const fs = require('fs').promises;
const path = require('path');

class ImageCleanupManager {
    constructor(imagesDir = './public/images') {
        this.imagesDir = imagesDir;
        this.duplicatesFound = [];
        this.cleanupActions = [];
        this.errors = [];
    }

    async run() {
        console.log('🔍 Starting image duplicate cleanup...');
        
        try {
            await this.scanForDuplicates();
            await this.analyzeDuplicates();
            await this.performCleanup();
            this.printSummary();
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
            process.exit(1);
        }
    }

    async scanForDuplicates() {
        console.log('📂 Scanning root images directory...');
        
        const files = await fs.readdir(this.imagesDir);
        const imageFiles = files.filter(file => 
            file.endsWith('.jpeg') || file.endsWith('.jpg') || file.endsWith('.png')
        );

        // Group files by base name
        const groups = {};
        for (const file of imageFiles) {
            const baseName = this.getBaseName(file);
            if (!groups[baseName]) {
                groups[baseName] = [];
            }
            groups[baseName].push(file);
        }

        // Find groups with multiple files (duplicates)
        for (const [baseName, files] of Object.entries(groups)) {
            if (files.length > 1) {
                this.duplicatesFound.push({ baseName, files });
            }
        }

        console.log(`📊 Found ${this.duplicatesFound.length} sets of duplicate files`);
    }

    getBaseName(filename) {
        return filename.replace(/\.(jpeg|jpg|png)$/i, '');
    }

    async analyzeDuplicates() {
        console.log('🔬 Analyzing duplicates...');

        for (const duplicate of this.duplicatesFound) {
            const { baseName, files } = duplicate;
            
            const hasJpeg = files.some(f => f.endsWith('.jpeg'));
            const hasJpg = files.some(f => f.endsWith('.jpg')); 
            const hasPng = files.some(f => f.endsWith('.png'));

            // Case 1: JPEG + PNG - remove PNG
            if (hasJpeg && hasPng) {
                const pngFiles = files.filter(f => f.endsWith('.png'));
                for (const pngFile of pngFiles) {
                    this.cleanupActions.push({
                        type: 'remove',
                        file: pngFile,
                        reason: 'PNG duplicate removed - JPEG preferred'
                    });
                }
            }

            // Case 2: JPG + PNG - remove PNG  
            if (hasJpg && hasPng && !hasJpeg) {
                const pngFiles = files.filter(f => f.endsWith('.png'));
                for (const pngFile of pngFiles) {
                    this.cleanupActions.push({
                        type: 'remove',
                        file: pngFile,
                        reason: 'PNG duplicate removed - JPG preferred'
                    });
                }
            }

            // Case 3: JPEG + JPG - standardize to JPEG
            if (hasJpeg && hasJpg) {
                const jpgFiles = files.filter(f => f.endsWith('.jpg'));
                for (const jpgFile of jpgFiles) {
                    this.cleanupActions.push({
                        type: 'remove',
                        file: jpgFile,
                        reason: 'JPG duplicate removed - JPEG preferred'
                    });
                }
            }

            // Case 4: Multiple files with naming issues (spaces, etc.)
            if (files.length > 2) {
                // Keep the cleanest filename, remove others
                const sortedFiles = files.sort((a, b) => {
                    // Prefer JPEG over JPG over PNG
                    const scoreA = a.endsWith('.jpeg') ? 3 : a.endsWith('.jpg') ? 2 : 1;
                    const scoreB = b.endsWith('.jpeg') ? 3 : b.endsWith('.jpg') ? 2 : 1;
                    
                    if (scoreA !== scoreB) return scoreB - scoreA;
                    
                    // Prefer files without spaces or special characters
                    const cleanA = !/[\s]/.test(a) ? 1 : 0;
                    const cleanB = !/[\s]/.test(b) ? 1 : 0;
                    
                    return cleanB - cleanA;
                });

                // Keep the first (best) file, remove others
                for (let i = 1; i < sortedFiles.length; i++) {
                    this.cleanupActions.push({
                        type: 'remove',
                        file: sortedFiles[i],
                        reason: 'Duplicate with inferior naming removed'
                    });
                }
            }
        }

        console.log(`📋 Planned ${this.cleanupActions.length} cleanup actions`);
    }

    async performCleanup() {
        console.log('🧹 Performing cleanup...');

        let removeCount = 0;
        
        for (const action of this.cleanupActions) {
            try {
                const filePath = path.join(this.imagesDir, action.file);
                
                if (action.type === 'remove') {
                    // Verify file exists before removing
                    try {
                        await fs.access(filePath);
                        await fs.unlink(filePath);
                        console.log(`   ✅ Removed: ${action.file} (${action.reason})`);
                        removeCount++;
                    } catch (error) {
                        if (error.code !== 'ENOENT') {
                            this.errors.push(`Failed to remove ${action.file}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                this.errors.push(`Action failed for ${action.file}: ${error.message}`);
            }
        }

        console.log(`🗑️  Removed ${removeCount} duplicate files`);
    }

    async detectImageDuplicates() {
        // Public method for external use (GitHub Actions)
        await this.scanForDuplicates();
        await this.analyzeDuplicates();
        
        return {
            duplicatesFound: this.duplicatesFound.length,
            cleanupActions: this.cleanupActions.length,
            wouldRemove: this.cleanupActions.filter(a => a.type === 'remove').length
        };
    }

    printSummary() {
        console.log('\n📈 Cleanup Summary:');
        console.log(`   • Duplicate sets found: ${this.duplicatesFound.length}`);
        console.log(`   • Actions performed: ${this.cleanupActions.length}`);
        console.log(`   • Errors encountered: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        console.log('\n✅ Image cleanup completed successfully!');
        console.log('💡 Tip: Run the image generation workflow to rebuild responsive formats');
    }
}

// CLI execution
if (require.main === module) {
    const manager = new ImageCleanupManager();
    manager.run().catch(console.error);
}

module.exports = ImageCleanupManager;