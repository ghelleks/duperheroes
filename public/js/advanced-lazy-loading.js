class AdvancedImageLoader {
    constructor() {
        this.imageObserver = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: '50px 0px', // Load 50px before entering viewport
                threshold: 0.01
            }
        );
        
        this.loadingImages = new Set();
        this.failedImages = new Set();
        this.loadedImages = new Set();
        
        // Performance tracking
        this.stats = {
            totalImages: 0,
            loadedCount: 0,
            failedCount: 0,
            startTime: null
        };
        
        this.init();
    }
    
    init() {
        // Auto-detect and observe images with data-src attribute
        this.observeExistingImages();
        
        // Watch for dynamically added images
        this.setupMutationObserver();
    }
    
    observeExistingImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.observe(img));
        this.stats.totalImages = lazyImages.length;
        
        if (this.stats.totalImages > 0) {
            this.stats.startTime = performance.now();
            console.log(`🖼️  Advanced lazy loader initialized with ${this.stats.totalImages} images`);
        }
    }
    
    setupMutationObserver() {
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check the node itself
                        if (node.matches && node.matches('img[data-src]')) {
                            this.observe(node);
                        }
                        // Check children
                        const lazyImages = node.querySelectorAll && node.querySelectorAll('img[data-src]');
                        if (lazyImages) {
                            lazyImages.forEach(img => this.observe(img));
                        }
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.loadingImages.has(entry.target)) {
                this.loadImage(entry.target);
            }
        });
    }
    
    async loadImage(img) {
        if (this.loadingImages.has(img) || this.loadedImages.has(img)) {
            return;
        }
        
        this.loadingImages.add(img);
        img.classList.add('loading');
        
        try {
            // Handle picture elements with WebP sources
            const picture = img.closest('picture');
            let imageSrc = img.dataset.src;
            
            if (picture) {
                const webpSource = picture.querySelector('source[type="image/webp"]');
                if (webpSource && this.supportsWebP()) {
                    imageSrc = webpSource.dataset.srcset || webpSource.srcset;
                }
            }
            
            // Pre-load the image to check if it loads successfully
            const testImg = new Image();
            
            await new Promise((resolve, reject) => {
                testImg.onload = () => {
                    // Image loaded successfully
                    this.applyImageSrc(img, picture);
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                    
                    // Trigger progressive loading effect
                    this.triggerProgressiveEffect(img);
                    
                    this.imageObserver.unobserve(img);
                    this.loadingImages.delete(img);
                    this.loadedImages.add(img);
                    this.stats.loadedCount++;
                    
                    resolve();
                };
                
                testImg.onerror = () => {
                    reject(new Error(`Failed to load image: ${imageSrc}`));
                };
                
                testImg.src = imageSrc;
            });
            
        } catch (error) {
            this.handleImageError(img, error);
        }
    }
    
    applyImageSrc(img, picture) {
        if (picture) {
            // Handle picture element with multiple sources
            const sources = picture.querySelectorAll('source');
            sources.forEach(source => {
                if (source.dataset.srcset) {
                    source.srcset = source.dataset.srcset;
                }
            });
        }
        
        // Set the main image src
        img.src = img.dataset.src;
        
        // Remove data-src to prevent re-processing
        delete img.dataset.src;
    }
    
    triggerProgressiveEffect(img) {
        // Fade out placeholder, fade in actual image
        const container = img.closest('.progressive-image');
        if (container) {
            const placeholder = container.querySelector('.placeholder');
            if (placeholder) {
                placeholder.classList.add('fade-out');
            }
        }
        
        // Trigger any custom load events
        img.dispatchEvent(new CustomEvent('lazyloaded', {
            bubbles: true,
            detail: { loader: this }
        }));
    }
    
    handleImageError(img, error) {
        console.warn('🖼️  Image load failed:', error.message);
        
        this.failedImages.add(img);
        this.loadingImages.delete(img);
        img.classList.remove('loading');
        img.classList.add('error');
        this.stats.failedCount++;
        
        // Show emoji fallback
        const container = img.closest('.progressive-image') || img.parentElement;
        const fallback = container?.querySelector('.emoji-fallback');
        
        if (fallback) {
            img.style.display = 'none';
            fallback.style.display = 'flex';
            fallback.classList.add('fallback-active');
        }
        
        this.imageObserver.unobserve(img);
        
        // Dispatch error event
        img.dispatchEvent(new CustomEvent('lazyerror', {
            bubbles: true,
            detail: { error, loader: this }
        }));
    }
    
    observe(img) {
        if (img.dataset.src && !this.loadedImages.has(img)) {
            this.imageObserver.observe(img);
        }
    }
    
    unobserve(img) {
        this.imageObserver.unobserve(img);
        this.loadingImages.delete(img);
    }
    
    supportsWebP() {
        // Check WebP support
        if (this._webpSupport !== undefined) {
            return this._webpSupport;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this._webpSupport = canvas.toDataURL('image/webp').indexOf('image/webp') !== -1;
        return this._webpSupport;
    }
    
    getStats() {
        const elapsed = this.stats.startTime ? performance.now() - this.stats.startTime : 0;
        return {
            ...this.stats,
            elapsedTime: Math.round(elapsed),
            successRate: this.stats.totalImages > 0 ? 
                Math.round((this.stats.loadedCount / this.stats.totalImages) * 100) : 0
        };
    }
    
    // Force load all remaining images (useful for debugging)
    loadAll() {
        const remaining = document.querySelectorAll('img[data-src]');
        remaining.forEach(img => this.loadImage(img));
    }
    
    // Clean up
    destroy() {
        this.imageObserver.disconnect();
        this.loadingImages.clear();
        this.failedImages.clear();
        this.loadedImages.clear();
    }
}

// Initialize global loader when DOM is ready
let globalImageLoader;

function initAdvancedLazyLoading() {
    if (!globalImageLoader) {
        globalImageLoader = new AdvancedImageLoader();
        
        // Expose to global scope for debugging
        window.imageLoader = globalImageLoader;
        
        // Add performance logging
        window.addEventListener('load', () => {
            setTimeout(() => {
                const stats = globalImageLoader.getStats();
                console.log('🖼️  Image loading stats:', stats);
            }, 1000);
        });
    }
    return globalImageLoader;
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedLazyLoading);
} else {
    initAdvancedLazyLoading();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedImageLoader, initAdvancedLazyLoading };
}