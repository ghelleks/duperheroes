// DuperHeroes Shared Battlecard Module

class BattlecardManager {
    constructor() {
        this.isVisible = false;
        this.currentHero = null;
        this.isFeedbackMode = false;
        this.feedbackResult = null;
        this.onCloseCallback = null;
        this.onShowCallback = null;
    }

    // Show battlecard for a hero (general viewing)
    showHeroBattlecard(hero, onCloseCallback = null, onShowCallback = null) {
        this.currentHero = hero;
        this.isFeedbackMode = false;
        this.feedbackResult = null;
        this.onCloseCallback = onCloseCallback;
        this.onShowCallback = onShowCallback;
        this.isVisible = true;
        
        // Call the show callback (for pausing timer)
        if (this.onShowCallback) {
            this.onShowCallback();
        }
        
        this.render();
    }

    // Show battlecard with feedback (for game guessing)
    showFeedbackBattlecard(hero, isCorrect, streakBonus = 0, onCloseCallback = null, onShowCallback = null) {
        this.currentHero = hero;
        this.isFeedbackMode = true;
        this.feedbackResult = { isCorrect, streakBonus };
        this.onCloseCallback = onCloseCallback;
        this.onShowCallback = onShowCallback;
        this.isVisible = true;
        
        // Call the show callback (for pausing timer)
        if (this.onShowCallback) {
            this.onShowCallback();
        }
        
        this.render();
    }

    // Hide the battlecard
    hideBattlecard() {
        this.isVisible = false;
        this.currentHero = null;
        this.isFeedbackMode = false;
        this.feedbackResult = null;
        
        // Remove modal from DOM
        const existing = document.getElementById('battlecard-modal');
        if (existing) {
            existing.remove();
        }

        // Call the callbacks if provided
        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
        
        // Clear the show callback
        this.onShowCallback = null;
    }

    // Render the battlecard modal
    render() {
        if (!this.isVisible || !this.currentHero) {
            this.hideBattlecard();
            return;
        }

        // Remove existing modal
        const existing = document.getElementById('battlecard-modal');
        if (existing) {
            existing.remove();
        }

        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'battlecard-modal';
        modal.className = 'battlecard-modal';
        modal.innerHTML = this.getBattlecardHTML();

        // Add to DOM
        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners(modal);
    }

    // Generate the battlecard HTML
    getBattlecardHTML() {
        const hero = this.currentHero;
        const heroImage = this.createResponsiveHeroImage(hero, 'large');

        const feedbackBanner = this.isFeedbackMode ? `
            <div class="feedback-banner ${this.feedbackResult.isCorrect ? '' : 'incorrect'}">
                ${this.feedbackResult.isCorrect ? '✅ CORRECT!' : '❌ INCORRECT'}
                ${this.feedbackResult.isCorrect && this.feedbackResult.streakBonus > 0 ? ` (+${this.feedbackResult.streakBonus} streak bonus!)` : ''}
            </div>
        ` : '';

        return `
            <div class="battlecard-popup" onclick="event.stopPropagation()">
                <button class="close-button" onclick="battlecardManager.hideBattlecard()">×</button>
                
                ${feedbackBanner}
                
                <div class="battlecard-header">
                    ${heroImage}
                    <h2 class="text-2xl font-bold mb-2">${hero.superhero_name}</h2>
                    <p class="text-lg opacity-90">${hero.real_name}</p>
                </div>
                
                <div class="battlecard-content">
                    <div class="battlecard-section">
                        <div class="battlecard-label">Origin Story</div>
                        <p>${hero.origin}</p>
                    </div>
                    
                    <div class="battlecard-section">
                        <div class="battlecard-label">Powers & Abilities</div>
                        <p>${hero.powers}</p>
                    </div>
                    
                    ${hero.trivia ? `
                        <div class="battlecard-section">
                            <div class="battlecard-label">Trivia</div>
                            <p>${hero.trivia}</p>
                        </div>
                    ` : ''}
                    
                    <div class="battlecard-section">
                        <div class="battlecard-label">Animal Theme</div>
                        <p>${this.getAnimalEmoji(hero.animal_theme)} ${hero.animal_theme}</p>
                    </div>
                    
                    <div class="battlecard-section">
                        <div class="battlecard-label">Inspired By</div>
                        <p>${hero.hero_inspiration}</p>
                    </div>
                    
                    <div class="battlecard-section">
                        <div class="battlecard-label">Difficulty</div>
                        <p>${hero.difficulty}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listeners for the modal
    setupEventListeners(modal) {
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideBattlecard();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideBattlecard();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Get animal emoji for a given animal theme
    getAnimalEmoji(animalTheme) {
        const emojiMap = {
            'Dog': '🐕', 'Poodle': '🐩', 'Frog': '🐸', 'Koala': '🐨',
            'Cat': '🐱', 'Monkey': '🐒', 'Bat': '🦇', 'Eagle': '🦅',
            'Horse': '🐴', 'Whale': '🐋', 'Fish': '🐟', 'Gecko': '🦎',
            'Canary': '🐦', 'Panther': '🐾', 'Anteater': '🐜', 'Bee': '🐝',
            'Octopus': '🐙', 'Dolphin': '🐬', 'Tiger': '🐅', 'Rhino Beetle': '🪲',
            'Lizard': '🦎', 'Snake': '🐍', 'Raccoon': '🦝', 'Shark': '🦈',
            'Deer': '🦌', 'Gorilla': '🦍', 'Cricket': '🦗', 'Kangaroo': '🦘',
            'Porcupine': '🦔', 'Albatross': '🕊️', 'Ram': '🐏', 'Dove': '🕊️',
            'Buffalo': '🐂', 'Skunk': '🦨', 'Peacock': '🦚', 'Magpie': '🐦‍⬛',
            'Owl': '🦉', 'Chameleon': '🦎', 'Rhino': '🦏', 'Polar Bear': '🐻‍❄️',
            'Salamander': '🦎', 'Turtle': '🐢', 'Hawk': '🦅', 'Spider': '🕷️',
            'Badger': '🦡', 'Sloth': '🦥', 'Lion': '🦁', 'Bear': '🐻', 
            'Panda': '🐼', 'Elephant': '🐘', 'Cow': '🐄', 'Pig': '🐷', 
            'Sheep': '🐑', 'Goat': '🐐', 'Camel': '🐪', 'Giraffe': '🦒', 
            'Zebra': '🦓', 'Moose': '🫎', 'Bison': '🦬', 'Ox': '🐂',
            'Duck': '🦆', 'Swan': '🦢', 'Penguin': '🐧', 'Flamingo': '🦩',
            'Parrot': '🦜', 'Chicken': '🐓', 'Turkey': '🦃', 'Squid': '🦑',
            'Shrimp': '🦐', 'Crab': '🦀', 'Lobster': '🦞', 'Crocodile': '🐊',
            'Scorpion': '🦂', 'Butterfly': '🦋', 'Ant': '🐜', 'Beetle': '🪲',
            'Grasshopper': '🦗', 'Dragonfly': '🪰', 'Fly': '🪰', 'Mosquito': '🦟',
            'Worm': '🪱', 'Snail': '🐌', 'Slug': '🐌', 'Mouse': '🐭',
            'Rat': '🐀', 'Hamster': '🐹', 'Rabbit': '🐰', 'Squirrel': '🐿️',
            'Chipmunk': '🐿️', 'Hedgehog': '🦔'
        };
        return emojiMap[animalTheme] || '🦸‍♂️';
    }

    // Generate hero slug for file names
    getHeroSlug(heroName) {
        return heroName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    // Get size configuration
    getSizeConfig(size) {
        const configs = {
            thumbnail: { width: 120, height: 120 },
            medium: { width: 300, height: 300 },
            large: { width: 600, height: 600 }
        };
        return configs[size] || configs.thumbnail;
    }

    // Create responsive hero image with progressive loading
    createResponsiveHeroImage(hero, size = 'large') {
        const slug = this.getHeroSlug(hero.superhero_name);
        const emoji = this.getAnimalEmoji(hero.animal_theme);
        const sizeConfig = this.getSizeConfig(size);
        const basePath = `./images/${size}/${slug}`;
        
        return `
            <div class="progressive-image hero-image-container hero-${size}">
                <!-- Placeholder with gradient -->
                <div class="placeholder"></div>
                
                <!-- Actual responsive image -->
                <picture>
                    <source data-srcset="${basePath}.webp" type="image/webp">
                    <img data-src="${basePath}.jpg" 
                         alt="${hero.superhero_name}" 
                         class="actual hero-image battlecard-image"
                         width="${sizeConfig.width}" 
                         height="${sizeConfig.height}">
                </picture>
                
                <!-- Emoji fallback -->
                <div class="emoji-fallback">
                    <span class="emoji">${emoji}</span>
                </div>
            </div>
        `;
    }
}

// Create a global instance
const battlecardManager = new BattlecardManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BattlecardManager, battlecardManager };
}