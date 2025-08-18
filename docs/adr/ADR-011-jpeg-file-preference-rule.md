# ADR-011: JPEG File Preference Rule Implementation

## Status
Proposed

## Context

The DuperHeroes application currently processes 194+ hero character images through an automated workflow that includes AI generation, responsive sizing, and WebP conversion. The image system has evolved organically, resulting in a mixed file format environment with both PNG and JPEG files coexisting for the same characters.

**Current State Analysis:**
- Mix of `.png` and `.jpeg` files in the `public/images/` directory
- Some heroes have multiple format versions (e.g., `shang-chimpanzee.jpeg` and `shang-chimpanzee.png`)
- GitHub Actions workflow processes all found image formats without preference
- Responsive image generation script converts all formats to JPEG outputs (lines 47-54 in `create-responsive-images.js`)
- WebP conversion only processes JPEG files (line 21 in `convert-to-webp.js`)
- Image loading in the frontend expects JPEG format for responsive variants

**Problems Identified:**
1. **File Duplication**: Multiple format versions of the same hero waste storage space
2. **Inconsistent Processing**: PNG files bypass WebP conversion workflow
3. **AI Generation Inefficiency**: PNG files generated when JPEG equivalents exist
4. **Maintenance Burden**: Duplicate cleanup requires manual intervention
5. **Performance Impact**: PNG files typically 40-60% larger than equivalent JPEG for photo-realistic hero images

**Business Requirements:**
- Maintain automated image processing workflow
- Optimize storage and bandwidth usage
- Ensure consistent image format handling across all systems
- Preserve backward compatibility during transition
- Support automated cleanup of redundant files

## Decision

We will implement a comprehensive JPEG file preference rule across all image processing systems in the DuperHeroes application. This rule establishes JPEG as the canonical format for hero character images while maintaining automated workflows for cleanup and regeneration.

**Core Policy:**
1. **Always prefer JPEG files over PNG** when both formats exist for the same hero
2. **Remove duplicate PNG/JPG files** when a preferred JPEG exists
3. **Regenerate from AI only when no JPEG exists** for a hero character
4. **Rebuild responsive variants** (thumbnail, medium, large) and WebP formats when source files change
5. **Maintain backward compatibility** with existing image loading systems

## Alternatives Considered

### Option 1: Format-Agnostic Processing
- **Description**: Continue processing all image formats equally without preference
- **Pros**: No workflow changes required, preserves existing file investments
- **Cons**: Continued storage waste, inconsistent WebP conversion, maintenance overhead from duplicates
- **Risk Level**: Low

### Option 2: PNG-to-JPEG Bulk Conversion
- **Description**: Convert all PNG files to JPEG and remove originals
- **Pros**: Immediate consistency, significant storage savings
- **Cons**: Potential quality loss from double compression, irreversible changes, no rollback capability
- **Risk Level**: High

### Option 3: Separate Workflows by Format
- **Description**: Maintain parallel processing workflows for PNG and JPEG
- **Pros**: Preserves format choices, gradual migration possible
- **Cons**: Increased complexity, duplicate maintenance burden, continued inconsistency
- **Risk Level**: Medium

### Option 4: Dynamic Format Selection
- **Description**: Implement runtime format detection and preference in image loading
- **Pros**: Flexible, preserves all formats, client-side optimization
- **Cons**: Increased frontend complexity, multiple HTTP requests for format detection, performance overhead
- **Risk Level**: Medium

## Consequences

### Positive
- **60-70% storage reduction** from eliminating PNG duplicates and preferring JPEG compression
- **Consistent WebP workflow** as all images flow through JPEG-based conversion pipeline
- **Simplified AI generation** with clear format targeting and duplicate prevention
- **Automated cleanup** removes manual maintenance burden for file management
- **Performance optimization** through smaller file sizes and consistent processing
- **Clear technical direction** for future image additions and processing
- **Maintained automation** preserves existing GitHub Actions workflow efficiency

### Negative
- **Initial migration overhead** to implement preference logic across all scripts
- **Temporary storage increase** during transition period before cleanup completes
- **Quality considerations** for images where PNG transparency or lossless compression was intentional
- **Script complexity increase** to handle preference logic and duplicate detection
- **Testing requirements** to validate preference rules across all scenarios

### Neutral
- **Backward compatibility maintained** - existing image loading continues to work
- **No external dependencies** - uses existing Sharp library and workflow infrastructure
- **Reversible decision** - can revert to format-agnostic processing if needed

## Implementation Notes

### Phase 1: Preference Detection and Cleanup
**Audit Script Enhancement (`audit-images.js`)**
```javascript
// Add JPEG preference logic to existing audit system
function detectImageDuplicates(heroSlug, availableImages) {
    const formats = availableImages.filter(img => img.heroSlug === heroSlug);
    const hasJpeg = formats.some(img => img.extension === 'jpeg');
    const hasPng = formats.some(img => img.extension === 'png');
    
    return {
        heroSlug,
        preferredFormat: hasJpeg ? 'jpeg' : 'png',
        duplicates: hasJpeg && hasPng ? formats.filter(img => img.extension === 'png') : [],
        actionRequired: hasJpeg && hasPng ? 'cleanup' : 'none'
    };
}
```

**Cleanup Automation**
- Identify PNG files with JPEG equivalents
- Verify JPEG file integrity before PNG removal
- Generate cleanup report for audit trail
- Implement dry-run mode for testing

### Phase 2: AI Generation Preference
**Image Generator Integration**
- Check for existing JPEG before triggering AI generation
- Skip generation if JPEG exists and is valid
- Only generate new images for heroes completely missing image files
- Update generation logs to reflect preference-based decisions

### Phase 3: Responsive Processing Updates
**Enhanced Workflow Integration**
```javascript
// Update responsive image generation to prefer JPEG sources
function selectPreferredSource(heroSlug, availableFormats) {
    // Priority: JPEG > PNG > other formats
    return availableFormats.find(f => f.endsWith('.jpeg')) ||
           availableFormats.find(f => f.endsWith('.jpg')) ||
           availableFormats.find(f => f.endsWith('.png')) ||
           availableFormats[0];
}
```

### GitHub Actions Workflow Updates
**Enhanced Processing Pipeline**
1. **Audit Phase**: Detect duplicates and generate cleanup recommendations
2. **Cleanup Phase**: Remove PNG duplicates where JPEG preferred source exists
3. **Generation Phase**: Only generate for heroes with no JPEG files
4. **Processing Phase**: Create responsive variants from preferred JPEG sources
5. **Conversion Phase**: Generate WebP from all JPEG responsive variants

### Success Metrics
- **Storage Efficiency**: 60-70% reduction in image storage usage
- **Processing Consistency**: 100% of responsive variants generated from JPEG sources
- **Automation Reliability**: Zero manual interventions required for format management
- **WebP Coverage**: 100% of hero images available in WebP format
- **Build Performance**: Reduced processing time through eliminated redundant operations

### Rollback Strategy
- Preserve PNG files in temporary backup during initial cleanup phase
- Implement verification checks before permanent deletion
- Maintain ability to regenerate responsive variants from backup sources
- Document preference rule changes for easy reversal if needed

## References
- [ADR-010: Image Loading Performance Optimization](./ADR-010-image-loading-performance-optimization.md)
- [Web.dev: Choose the Right Image Format](https://web.dev/choose-the-right-image-format/)
- [MDN: Image File Type Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types)
- [GitHub Issue: Image Format Standardization](https://github.com/ghelleks/duperheroes/issues/17)
- [Sharp Library Documentation](https://sharp.pixelplumbing.com/)
- [Current Audit Script](../scripts/audit-images.js)
- [Responsive Image Generation](../scripts/create-responsive-images.js)
- [WebP Conversion Script](../scripts/convert-to-webp.js)