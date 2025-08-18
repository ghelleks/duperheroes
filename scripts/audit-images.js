#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Image Audit System for DuperHeroes
 * 
 * Compares the heroes database with available images and provides
 * comprehensive reporting on image coverage and orphaned files.
 * 
 * Implements ADR-011: JPEG File Preference Rule
 * - Prefers JPEG over PNG files
 * - Identifies duplicate format issues
 * - Suggests cleanup actions
 */

// Configuration
const HEROES_JSON_PATH = path.join(__dirname, '../public/heroes.json');
const IMAGE_DIRECTORIES = [
    path.join(__dirname, '../public/images')
];
const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
const DEBUG_OUTPUT_FILE = path.join(__dirname, '../public/debug/image-audit.json');

/**
 * Generates a hero slug matching the game's logic
 */
function generateHeroSlug(superheroName) {
    return superheroName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

/**
 * Scans a directory for image files
 */
function scanDirectoryForImages(dirPath) {
    const images = [];
    
    if (!fs.existsSync(dirPath)) {
        console.log(`📁 Directory not found: ${dirPath}`);
        return images;
    }
    
    try {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isFile()) {
                const ext = path.extname(file).toLowerCase().substring(1);
                if (SUPPORTED_EXTENSIONS.includes(ext)) {
                    images.push({
                        filename: file,
                        basename: path.basename(file, path.extname(file)),
                        extension: ext,
                        fullPath: filePath,
                        directory: path.basename(dirPath),
                        size: stat.size
                    });
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error scanning directory ${dirPath}: ${error.message}`);
    }
    
    return images;
}

/**
 * Loads and parses the heroes JSON file
 */
function loadHeroes() {
    try {
        if (!fs.existsSync(HEROES_JSON_PATH)) {
            throw new Error(`Heroes JSON file not found: ${HEROES_JSON_PATH}`);
        }
        
        const heroesData = JSON.parse(fs.readFileSync(HEROES_JSON_PATH, 'utf8'));
        
        if (!heroesData.heroes || !Array.isArray(heroesData.heroes)) {
            throw new Error('Invalid heroes JSON structure - missing heroes array');
        }
        
        return heroesData.heroes;
    } catch (error) {
        console.error(`❌ Error loading heroes: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Finds image matches for a hero
 */
function findHeroImages(heroSlug, allImages) {
    return allImages.filter(image => {
        // Exact match
        if (image.basename === heroSlug) return true;
        
        // Match with variations (e.g., captain-canine.jpg vs captain-canine.png.jpg)
        if (image.basename.startsWith(heroSlug) && 
            (image.basename === heroSlug || image.basename.startsWith(heroSlug + '.'))) {
            return true;
        }
        
        return false;
    });
}

/**
 * Performs the main audit analysis
 */
function performAudit() {
    console.log('🔍 DuperHeroes Image Audit');
    console.log('==========================');
    
    // Load heroes data
    console.log('📚 Loading heroes database...');
    const heroes = loadHeroes();
    console.log(`✅ Loaded ${heroes.length} heroes`);
    
    // Scan all image directories
    console.log('\n📁 Scanning image directories...');
    const allImages = [];
    for (const dirPath of IMAGE_DIRECTORIES) {
        const images = scanDirectoryForImages(dirPath);
        allImages.push(...images);
        console.log(`  ${path.basename(dirPath)}: ${images.length} images`);
    }
    console.log(`✅ Found ${allImages.length} total images`);
    
    // Generate hero slugs and match with images
    console.log('\n🔗 Analyzing hero-image relationships...');
    const auditResults = {
        heroesWithImages: [],
        heroesWithoutImages: [],
        orphanedImages: [...allImages], // Start with all images, remove as we find matches
        duplicateImages: [],
        stats: {
            totalHeroes: heroes.length,
            totalImages: allImages.length,
            heroesWithImages: 0,
            heroesWithoutImages: 0,
            orphanedImages: 0,
            duplicateImages: 0
        }
    };
    
    // Process each hero
    for (const hero of heroes) {
        const slug = generateHeroSlug(hero.superhero_name);
        const matchingImages = findHeroImages(slug, allImages);
        
        if (matchingImages.length > 0) {
            auditResults.heroesWithImages.push({
                hero: hero,
                slug: slug,
                images: matchingImages
            });
            
            // Check for duplicates and format preferences
            if (matchingImages.length > 1) {
                const hasJpeg = matchingImages.some(img => img.extension === 'jpeg');
                const hasPng = matchingImages.some(img => img.extension === 'png');
                const hasJpg = matchingImages.some(img => img.extension === 'jpg');
                
                auditResults.duplicateImages.push({
                    hero: hero,
                    slug: slug,
                    images: matchingImages,
                    formatIssue: {
                        hasJpeg,
                        hasPng,
                        hasJpg,
                        violatesJpegRule: hasJpeg && (hasPng || hasJpg),
                        recommendedAction: hasJpeg && hasPng ? 'Remove PNG files' : 
                                         hasJpeg && hasJpg ? 'Remove JPG files' : 
                                         hasJpg && hasPng ? 'Remove PNG files' : 'Review naming'
                    }
                });
            }
            
            // Remove matched images from orphaned list
            for (const image of matchingImages) {
                const index = auditResults.orphanedImages.findIndex(img => 
                    img.fullPath === image.fullPath
                );
                if (index !== -1) {
                    auditResults.orphanedImages.splice(index, 1);
                }
            }
        } else {
            auditResults.heroesWithoutImages.push({
                hero: hero,
                slug: slug
            });
        }
    }
    
    // Update stats
    auditResults.stats.heroesWithImages = auditResults.heroesWithImages.length;
    auditResults.stats.heroesWithoutImages = auditResults.heroesWithoutImages.length;
    auditResults.stats.orphanedImages = auditResults.orphanedImages.length;
    auditResults.stats.duplicateImages = auditResults.duplicateImages.length;
    
    return auditResults;
}

/**
 * Displays the audit report
 */
function displayReport(auditResults) {
    const { stats, heroesWithImages, heroesWithoutImages, orphanedImages, duplicateImages } = auditResults;
    
    console.log('\n📊 AUDIT RESULTS');
    console.log('================');
    console.log(`Total Heroes: ${stats.totalHeroes}`);
    console.log(`Total Images: ${stats.totalImages}`);
    console.log(`Heroes with Images: ${stats.heroesWithImages} (${Math.round(stats.heroesWithImages/stats.totalHeroes*100)}%)`);
    console.log(`Heroes without Images: ${stats.heroesWithoutImages} (${Math.round(stats.heroesWithoutImages/stats.totalHeroes*100)}%)`);
    console.log(`Orphaned Images: ${stats.orphanedImages}`);
    console.log(`Duplicate Images: ${stats.duplicateImages}`);
    
    // Heroes with images
    if (heroesWithImages.length > 0) {
        console.log('\n✅ HEROES WITH IMAGES');
        console.log('======================');
        for (const item of heroesWithImages) {
            const imageList = item.images.map(img => `${img.filename} (${img.directory})`).join(', ');
            console.log(`  ${item.hero.superhero_name} (${item.slug})`);
            console.log(`    → ${imageList}`);
        }
    }
    
    // Heroes without images
    if (heroesWithoutImages.length > 0) {
        console.log('\n❌ HEROES WITHOUT IMAGES');
        console.log('==========================');
        for (const item of heroesWithoutImages) {
            console.log(`  ${item.hero.superhero_name} (${item.slug})`);
            console.log(`    → Using emoji fallback: ${getAnimalEmoji(item.hero.animal_theme)}`);
        }
    }
    
    // Orphaned images
    if (orphanedImages.length > 0) {
        console.log('\n⚠️  ORPHANED IMAGES');
        console.log('===================');
        console.log('Images with no corresponding hero entries:');
        for (const image of orphanedImages) {
            console.log(`  ${image.filename} (${image.directory}) - ${formatBytes(image.size)}`);
        }
    }
    
    // Duplicate images with JPEG preference analysis
    if (duplicateImages.length > 0) {
        console.log('\n🔄 DUPLICATE IMAGES & FORMAT ISSUES');
        console.log('====================================');
        for (const item of duplicateImages) {
            console.log(`  ${item.hero.superhero_name} (${item.slug})`);
            for (const image of item.images) {
                const preferredMark = item.formatIssue.violatesJpegRule ? 
                    (image.extension === 'jpeg' ? ' ✅ KEEP' : 
                     image.extension === 'png' && item.formatIssue.hasJpeg ? ' ❌ REMOVE' :
                     image.extension === 'jpg' && item.formatIssue.hasJpeg ? ' ❌ REMOVE' : '') : '';
                console.log(`    → ${image.filename} (${image.directory})${preferredMark}`);
            }
            if (item.formatIssue.violatesJpegRule) {
                console.log(`    💡 Action: ${item.formatIssue.recommendedAction}`);
            }
        }
    }
    
    // Summary and recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    if (stats.heroesWithoutImages > 0) {
        console.log(`• Create images for ${stats.heroesWithoutImages} heroes missing images`);
    }
    
    if (stats.orphanedImages > 0) {
        console.log(`• Review ${stats.orphanedImages} orphaned images - delete unused or rename to match heroes`);
    }
    
    if (stats.duplicateImages > 0) {
        const jpegViolations = duplicateImages.filter(item => item.formatIssue.violatesJpegRule).length;
        console.log(`• Resolve ${stats.duplicateImages} heroes with multiple images - choose primary image`);
        if (jpegViolations > 0) {
            console.log(`• Fix ${jpegViolations} JPEG preference rule violations - run cleanup script`);
        }
    }
    
    if (stats.heroesWithImages === stats.totalHeroes && stats.orphanedImages === 0) {
        console.log('🎉 Perfect! All heroes have images and no orphaned files exist.');
    }
}

/**
 * Gets animal emoji (simplified version from main game)
 */
function getAnimalEmoji(animalTheme) {
    const emojiMap = {
        'Dog': '🐕', 'Poodle': '🐩', 'Frog': '🐸', 'Koala': '🐨',
        'Cat': '🐱', 'Monkey': '🐒', 'Bat': '🦇', 'Eagle': '🦅',
        'Horse': '🐴', 'Whale': '🐋', 'Fish': '🐟', 'Gecko': '🦎',
        'Canary': '🐦', 'Panther': '🐾', 'Anteater': '🐜', 'Bee': '🐝',
        'Octopus': '🐙', 'Dolphin': '🐬', 'Tiger': '🐅', 'Snake': '🐍',
        'Raccoon': '🦝', 'Shark': '🦈', 'Deer': '🦌', 'Gorilla': '🦍',
        'Cricket': '🦗', 'Kangaroo': '🦘', 'Porcupine': '🦔', 'Spider': '🕷️'
    };
    return emojiMap[animalTheme] || '🦸‍♂️';
}

/**
 * Formats bytes for human reading
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generates JSON report (optional)
 */
function generateJSONReport(auditResults, outputPath) {
    try {
        const report = {
            timestamp: new Date().toISOString(),
            stats: auditResults.stats,
            heroesWithImages: auditResults.heroesWithImages.map(item => ({
                heroName: item.hero.superhero_name,
                slug: item.slug,
                images: item.images.map(img => ({
                    filename: img.filename,
                    directory: img.directory,
                    size: img.size
                }))
            })),
            heroesWithoutImages: auditResults.heroesWithoutImages.map(item => ({
                heroName: item.hero.superhero_name,
                slug: item.slug,
                animalTheme: item.hero.animal_theme
            })),
            orphanedImages: auditResults.orphanedImages.map(img => ({
                filename: img.filename,
                directory: img.directory,
                size: img.size
            }))
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 JSON report saved to: ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error saving JSON report: ${error.message}`);
    }
}

/**
 * Saves debug output for the debug page
 */
function saveDebugOutput(auditResults, logs, status, error = null) {
    try {
        // Ensure debug directory exists
        const debugDir = path.dirname(DEBUG_OUTPUT_FILE);
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
        }
        
        const debugData = {
            timestamp: new Date().toISOString(),
            status: status,
            stats: auditResults ? auditResults.stats : null,
            heroesWithImages: auditResults && auditResults.heroesWithImages ? auditResults.heroesWithImages.map(item => ({
                heroName: item.hero ? item.hero.superhero_name : 'Unknown Hero',
                slug: item.slug || 'unknown',
                images: item.images ? item.images.map(img => ({
                    filename: img.filename,
                    directory: img.directory,
                    size: img.size
                })) : []
            })) : [],
            heroesWithoutImages: auditResults && auditResults.heroesWithoutImages ? auditResults.heroesWithoutImages.map(item => ({
                heroName: item.hero ? item.hero.superhero_name : 'Unknown Hero',
                slug: item.slug || 'unknown',
                animalTheme: item.hero ? item.hero.animal_theme : 'Unknown'
            })) : [],
            orphanedImages: auditResults ? auditResults.orphanedImages.map(img => ({
                filename: img.filename,
                directory: img.directory,
                size: img.size
            })) : [],
            logs: logs,
            error: error ? error.message : null,
            imageDirectories: IMAGE_DIRECTORIES.map(dir => path.basename(dir)),
            supportedExtensions: SUPPORTED_EXTENSIONS
        };
        
        fs.writeFileSync(DEBUG_OUTPUT_FILE, JSON.stringify(debugData, null, 2));
        console.log(`📄 Debug output saved to: ${DEBUG_OUTPUT_FILE}`);
    } catch (debugError) {
        console.error(`❌ Error saving debug output: ${debugError.message}`);
    }
}

/**
 * Main execution function
 */
function main() {
    const logs = [];
    const originalConsoleLog = console.log;
    
    // Capture console output for debug logging
    console.log = (...args) => {
        const message = args.join(' ');
        logs.push(message);
        originalConsoleLog(...args);
    };
    
    try {
        const auditResults = performAudit();
        displayReport(auditResults);
        
        // Generate JSON report if requested
        const jsonOutputArg = process.argv.find(arg => arg.startsWith('--json='));
        if (jsonOutputArg) {
            const outputPath = jsonOutputArg.split('=')[1];
            generateJSONReport(auditResults, outputPath);
        }
        
        // Save debug output
        saveDebugOutput(auditResults, logs, 'success');
        
        // Exit with error code if there are issues (for CI/CD)
        const hasIssues = auditResults.stats.orphanedImages > 0 || 
                         auditResults.stats.heroesWithoutImages > 0;
        
        if (hasIssues && process.argv.includes('--strict')) {
            console.log('\n❌ Audit completed with issues. Exiting with error code for CI/CD.');
            process.exit(1);
        } else {
            console.log('\n✅ Audit completed successfully.');
            process.exit(0);
        }
        
    } catch (error) {
        console.error(`❌ Fatal error during audit: ${error.message}`);
        
        // Save debug output with error
        saveDebugOutput(null, logs, 'error', error);
        
        process.exit(1);
    } finally {
        // Restore original console.log
        console.log = originalConsoleLog;
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateHeroSlug,
    scanDirectoryForImages,
    loadHeroes,
    findHeroImages,
    performAudit,
    displayReport
};