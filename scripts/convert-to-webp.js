const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function convertToWebP() {
    const directories = ['thumbnails', 'medium', 'large'];
    
    console.log('🌐 Starting WebP conversion...');
    
    let totalConverted = 0;
    let totalErrors = 0;
    
    for (const dir of directories) {
        const inputDir = `public/images/${dir}`;
        
        try {
            // Check if directory exists
            await fs.access(inputDir);
            
            const files = await fs.readdir(inputDir);
            const jpegFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
            
            console.log(`📁 Processing ${dir} directory: ${jpegFiles.length} JPEG files`);
            
            for (const file of jpegFiles) {
                const inputPath = path.join(inputDir, file);
                const outputPath = path.join(inputDir, file.replace(/\.(jpg|jpeg)$/i, '.webp'));
                
                try {
                    // Check if WebP version already exists and is newer
                    try {
                        const [inputStat, outputStat] = await Promise.all([
                            fs.stat(inputPath),
                            fs.stat(outputPath)
                        ]);
                        
                        if (outputStat.mtime >= inputStat.mtime) {
                            console.log(`⏭️  Skipping ${file} (WebP already exists and is up to date)`);
                            continue;
                        }
                    } catch (error) {
                        // WebP doesn't exist, proceed with conversion
                    }
                    
                    await sharp(inputPath)
                        .webp({ quality: 85, effort: 4 })
                        .toFile(outputPath);
                        
                    console.log(`✅ WebP created: ${path.basename(outputPath)}`);
                    totalConverted++;
                    
                } catch (error) {
                    console.error(`❌ Error converting ${file}:`, error.message);
                    totalErrors++;
                }
            }
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`⚠️  Directory ${inputDir} not found - skipping`);
            } else {
                console.error(`❌ Error processing ${dir}:`, error.message);
                totalErrors++;
            }
        }
    }
    
    console.log(`\n🎉 WebP conversion complete!`);
    console.log(`   ✅ Successfully converted: ${totalConverted} images`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    
    if (totalConverted === 0 && totalErrors === 0) {
        console.log(`   ℹ️  Note: Run 'npm run images:responsive' first to generate base images`);
    }
}

// Run the script
if (require.main === module) {
    convertToWebP().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { convertToWebP };