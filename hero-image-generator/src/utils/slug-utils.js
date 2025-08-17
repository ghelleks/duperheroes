/**
 * Slug Generation Utilities
 * 
 * Reuses the slug generation logic from the audit-images.js script
 * to ensure consistent filename generation across the system.
 */

/**
 * Generates a hero slug matching the game's logic
 * This function is identical to the one in scripts/audit-images.js
 */
function generateHeroSlug(superheroName) {
    return superheroName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

/**
 * Generate image filename for a hero
 */
function generateImageFilename(hero, extension = 'png') {
    const slug = generateHeroSlug(hero.superhero_name);
    return `${slug}.${extension}`;
}

/**
 * Generate image path relative to public directory
 */
function generateImagePath(hero, extension = 'png') {
    const filename = generateImageFilename(hero, extension);
    return `./images/${filename}`;
}

/**
 * Validate slug format
 */
function validateSlug(slug) {
    // Check if slug matches expected format: lowercase, alphanumeric, hyphens
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugPattern.test(slug);
}

/**
 * Generate all possible filename variations for a hero
 * Useful for checking existing files
 */
function generateFilenameVariations(hero) {
    const slug = generateHeroSlug(hero.superhero_name);
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    
    const variations = [];
    for (const ext of extensions) {
        variations.push(`${slug}.${ext}`);
    }
    
    return variations;
}

/**
 * Extract slug from filename
 */
function extractSlugFromFilename(filename) {
    const extensionPattern = /\.(png|jpg|jpeg|webp|gif|svg)$/i;
    return filename.replace(extensionPattern, '');
}

module.exports = {
    generateHeroSlug,
    generateImageFilename,
    generateImagePath,
    validateSlug,
    generateFilenameVariations,
    extractSlugFromFilename
};