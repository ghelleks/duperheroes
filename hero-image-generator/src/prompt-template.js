/**
 * Prompt Template System for Hero Image Generation
 * 
 * Creates simple, effective prompts for generating superhero images
 * based on hero data from the DuperHeroes database.
 */

class PromptTemplate {
    constructor() {
        // Simple template format
        this.promptTemplate = "create a photo for this mutant animal character in action. here is some inspiring information:\n\n{heroInfo}\n\nthe image is in the style of comic book illustrator Marco Checchetto";
    }

    /**
     * Generate a simple prompt for a hero
     */
    generatePrompt(hero) {
        const heroInfo = this.buildHeroInfo(hero);
        const prompt = this.promptTemplate.replace('{heroInfo}', heroInfo);
        
        return {
            prompt: prompt,
            negativePrompt: this.getNegativePrompt(),
            metadata: {
                heroName: hero.superhero_name,
                animalTheme: hero.animal_theme,
                inspiration: hero.hero_inspiration,
                difficulty: hero.difficulty
            }
        };
    }

    /**
     * Build hero information in the specified format
     */
    buildHeroInfo(hero) {
        const animalEmoji = this.getAnimalEmoji(hero.animal_theme);
        
        return `${hero.superhero_name} (${animalEmoji}) - ${hero.real_name}
Inspired by: ${hero.hero_inspiration}
Powers: ${hero.powers}
Origin: ${hero.origin}
Difficulty: ${hero.difficulty}`;
    }

    /**
     * Get animal emoji for the hero
     */
    getAnimalEmoji(animalTheme) {
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
     * Get negative prompt to avoid unwanted elements
     */
    getNegativePrompt() {
        return "low quality, blurry, multiple characters, text, watermarks, realistic photography, dark gritty tone";
    }

    /**
     * Generate test prompt for validation
     */
    generateTestPrompt() {
        const testHero = {
            superhero_name: "Captain Bulldog",
            real_name: "Brian Brad-dog",
            powers: "Mystical strength derived from the Amulet of Right-On, flight (more of a determined, droopy-jowled glide), Force Field generation (powered by sheer stubbornness), can summon a cup of tea in any situation.",
            origin: "A mild-mannered bulldog from Essex who stumbled upon the mystical burial site of Merlin the Magician while chasing a squirrel. Chosen for his indomitable spirit (and refusal to let go of a squeaky toy), he now protects the United Kingdom from mystical threats and improperly brewed tea.",
            animal_theme: "Dog",
            hero_inspiration: "Captain Britain",
            difficulty: "Medium"
        };
        
        return this.generatePrompt(testHero);
    }
}

module.exports = PromptTemplate;