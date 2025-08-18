const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
    thumbnail: { width: 120, height: 120, quality: 80 },
    medium: { width: 300, height: 300, quality: 85 },
    large: { width: 600, height: 600, quality: 90 }
};

async function generateResponsiveImages() {
    const inputDir = 'public/images';
    const outputDirs = {
        thumbnail: 'public/images/thumbnail',
        medium: 'public/images/medium',
        large: 'public/images/large'
    };
    
    console.log('🖼️  Starting responsive image generation...');
    
    // Create output directories
    for (const dir of Object.values(outputDirs)) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
    
    try {
        const files = await fs.readdir(inputDir);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png)$/i.test(file) && !file.startsWith('.')
        );
        
        console.log(`🎯 Found ${imageFiles.length} image files to process`);
        
        let processed = 0;
        let errors = 0;
        
        for (const file of imageFiles) {
            const inputPath = path.join(inputDir, file);
            const baseName = path.parse(file).name;
            
            try {
                // Check if input file exists and is readable
                await fs.access(inputPath);
                
                for (const [sizeName, config] of Object.entries(sizes)) {
                    const outputPath = path.join(outputDirs[sizeName], `${baseName}.jpg`);
                    
                    await sharp(inputPath)
                        .resize(config.width, config.height, {
                            fit: 'cover',
                            position: 'center'
                        })
                        .jpeg({ quality: config.quality })
                        .toFile(outputPath);
                        
                    console.log(`✅ Generated ${sizeName}: ${baseName}.jpg`);
                }
                processed++;
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n🎉 Responsive image generation complete!`);
        console.log(`   ✅ Successfully processed: ${processed} images`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📊 Total variants created: ${processed * Object.keys(sizes).length}`);
        
    } catch (error) {
        console.error('❌ Fatal error during image processing:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    generateResponsiveImages().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { generateResponsiveImages, sizes };