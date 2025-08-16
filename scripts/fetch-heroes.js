#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Google Doc to Heroes JSON Generator
 * 
 * Fetches hero data from Google Doc and generates public/heroes.json
 * with child-friendly error handling and flexible parsing.
 */

// Configuration
const GOOGLE_DOC_ID = '1EqPn6k6UicD8uTSbKQ0z4SuBKC19UPI-GC1PAjy3VUY';
const GOOGLE_DOC_URL = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/export?format=txt`;
const OUTPUT_FILE = path.join(__dirname, '../public/heroes.json');
const FALLBACK_FILE = path.join(__dirname, '../public/heroes.json');

// Animal emoji mapping for theme extraction
const ANIMAL_EMOJIS = {
  '🐕': 'Dog',
  '🐩': 'Poodle', 
  '🐸': 'Frog',
  '🐨': 'Koala',
  '🐱': 'Cat',
  '🐵': 'Monkey',
  '🦇': 'Bat',
  '🦅': 'Eagle',
  '🐴': 'Horse',
  '🐋': 'Whale',
  '🐟': 'Fish',
  '🦎': 'Gecko',
  '🐦': 'Canary',
  '🐆': 'Panther',
  '🐜': 'Anteater',
  '🐝': 'Bee',
  '🐙': 'Octopus',
  '🐬': 'Dolphin',
  '🐅': 'Tiger',
  '🪲': 'Rhino Beetle',
  '🦕': 'Lizard',
  '🐍': 'Snake',
  '🦝': 'Raccoon',
  '🦈': 'Shark',
  '🦌': 'Deer',
  '🦍': 'Gorilla',
  '🦗': 'Cricket',
  '🦘': 'Kangaroo',
  '🦔': 'Porcupine',
  '🕷️': 'Spider',
  '🦡': 'Badger',
  '🦥': 'Sloth',
  '🐢': 'Turtle',
  '🦅': 'Hawk',
  '🐻‍❄️': 'Polar Bear',
  '🦎': 'Salamander',
  '🐃': 'Buffalo',
  '🦨': 'Skunk',
  '🦚': 'Peacock',
  '🦆': 'Magpie',
  '🦉': 'Owl',
  '🦎': 'Chameleon',
  '🦏': 'Rhino',
  '🐕‍🦺': 'Dove',
  '🐰': 'Ram'
};

/**
 * Fetches content from Google Doc with redirect handling
 */
async function fetchGoogleDoc(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    console.log('Fetching Google Doc...');
    
    const makeRequest = (currentUrl, redirectCount = 0) => {
      if (redirectCount >= maxRedirects) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      https.get(currentUrl, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`→ Following redirect to: ${response.headers.location}`);
          makeRequest(response.headers.location, redirectCount + 1);
          return;
        }
        
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          if (response.statusCode === 200) {
            console.log(`✓ Successfully fetched document (${data.length} characters)`);
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          }
        });
        
      }).on('error', (error) => {
        reject(error);
      });
    };
    
    makeRequest(url);
  });
}

/**
 * Extracts animal theme from emoji or character name
 */
function extractAnimalTheme(line) {
  // First try to find emoji
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const emojiMatch = line.match(emojiRegex);
  if (emojiMatch && ANIMAL_EMOJIS[emojiMatch[0]]) {
    return ANIMAL_EMOJIS[emojiMatch[0]];
  }
  
  // Fallback: try to infer from character name
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes('canine') || lowerLine.includes('dog')) return 'Dog';
  if (lowerLine.includes('cat') || lowerLine.includes('whiskers')) return 'Cat';
  if (lowerLine.includes('frog') || lowerLine.includes('hopper')) return 'Frog';
  if (lowerLine.includes('eagle') || lowerLine.includes('bird')) return 'Eagle';
  if (lowerLine.includes('horse') || lowerLine.includes('bred')) return 'Horse';
  if (lowerLine.includes('spider')) return 'Spider';
  if (lowerLine.includes('bat')) return 'Bat';
  if (lowerLine.includes('whale') || lowerLine.includes('mammal')) return 'Whale';
  
  return 'Unknown'; // Default fallback
}


/**
 * Normalizes difficulty to standard values
 */
function normalizeDifficulty(difficulty) {
  const lower = difficulty.toLowerCase();
  if (lower.includes('easy') || lower.includes('beginner')) return 'Easy';
  if (lower.includes('hard') || lower.includes('difficult') || lower.includes('expert')) return 'Hard';
  return 'Medium'; // Default
}

/**
 * Parses individual character entry
 */
function parseCharacterEntry(entryText) {
  if (!entryText || entryText.trim().length === 0) {
    return null;
  }
  
  // Split into lines for better field parsing
  const lines = entryText.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    return null;
  }
  
  // Extract character name from first line
  const firstLine = lines[0];
  let superhero_name, real_name;
  
  // Clean emoji from text for name extraction
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  
  // Pattern: "1. Name (emoji) - Real Name" or "1. **Name** (emoji) - Real Name"
  const namePatterns = [
    /^\d+\.\s*\*\*(.+?)\*\*\s*\([^)]*\)\s*[-–—]\s*(.+?)$/,
    /^\d+\.\s*(.+?)\s*\([^)]*\)\s*[-–—]\s*(.+?)$/,
    /^\d+\.\s*(.+?)\s*[-–—]\s*(.+?)$/,
    /^\d+\.\s*(.+?)$/
  ];
  
  for (const pattern of namePatterns) {
    const match = firstLine.match(pattern);
    if (match) {
      superhero_name = match[1].replace(emojiRegex, '').trim();
      real_name = match[2] ? match[2].replace(emojiRegex, '').trim() : '';
      break;
    }
  }
  
  if (!superhero_name) {
    console.warn('⚠️  Skipping entry: No superhero name found in:', firstLine.substring(0, 50) + '...');
    return null;
  }
  
  // Parse structured fields from bullet points
  const fields = {};
  let currentField = null;
  let currentValue = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a new field
    const fieldMatch = line.match(/^\*\s*(inspired\s+by|powers?|abilities|origin|story|background|difficulty|trivia|fun\s+fact):\s*(.*)$/i);
    
    if (fieldMatch) {
      // Save previous field
      if (currentField && currentValue.length > 0) {
        fields[currentField] = currentValue.join(' ').trim();
      }
      
      // Start new field
      const fieldName = fieldMatch[1].toLowerCase();
      currentField = fieldName;
      currentValue = [fieldMatch[2]];
    } else if (currentField && line.startsWith('*') && !line.match(/^\*\s*(inspired|powers?|abilities|origin|story|background|difficulty|trivia)/i)) {
      // Continue current field if it's a continuation bullet point
      currentValue.push(line.replace(/^\*\s*/, ''));
    } else if (currentField && !line.match(/^\d+\./)) {
      // Continue current field if not starting a new character
      currentValue.push(line);
    }
  }
  
  // Save the last field
  if (currentField && currentValue.length > 0) {
    fields[currentField] = currentValue.join(' ').trim();
  }
  
  // Map field names to standardized names
  const powers = fields['powers'] || fields['abilities'] || fields['power'] || '';
  const origin = fields['origin'] || fields['story'] || fields['background'] || '';
  const hero_inspiration = fields['inspired by'] || fields['inspiration'] || '';
  const difficulty = normalizeDifficulty(fields['difficulty'] || 'Medium');
  const trivia = fields['trivia'] || fields['fun fact'] || '';
  
  // Extract animal theme from emoji
  const animal_theme = extractAnimalTheme(firstLine);
  
  // Validate essential fields
  if (!powers || powers.length < 10) {
    console.warn(`⚠️  Skipping ${superhero_name}: Powers too short or missing`);
    return null;
  }
  
  const character = {
    superhero_name: superhero_name.replace(/^\d+\.\s*/, '').trim(),
    real_name: real_name || `${superhero_name} (Real Name Unknown)`,
    powers: powers,
    origin: origin || 'Origin unknown',
    trivia: trivia || `${superhero_name} is a unique hero with many secrets.`,
    animal_theme,
    hero_inspiration: hero_inspiration || 'Original Character',
    difficulty
  };
  
  console.log(`✓ Parsed: ${character.superhero_name} (${character.animal_theme}, ${character.difficulty})`);
  return character;
}

/**
 * Splits document into individual character entries
 */
function splitIntoEntries(text) {
  // Clean up the text and look for numbered character entries
  const entries = [];
  
  // Split by numbered entries (1., 2., etc) but preserve the number
  const parts = text.split(/(?=^\d+\.\s)/m);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Skip headers and non-character content
    if (trimmed.toLowerCase().includes('animal heroes') || 
        trimmed.toLowerCase().includes('character roster') ||
        trimmed.toLowerCase().includes('core characters') ||
        trimmed.toLowerCase().includes('extended roster') ||
        trimmed.length < 50) {
      continue;
    }
    
    entries.push(trimmed);
  }
  
  console.log(`📝 Split document into ${entries.length} potential character entries`);
  return entries;
}

/**
 * Main parsing function
 */
function parseHeroesData(docText) {
  console.log('🔍 Parsing heroes data...');
  
  const entries = splitIntoEntries(docText);
  const heroes = [];
  let skippedCount = 0;
  
  for (const entry of entries) {
    try {
      const character = parseCharacterEntry(entry.trim());
      if (character) {
        heroes.push(character);
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.warn(`⚠️  Error parsing entry: ${error.message}`);
      skippedCount++;
    }
  }
  
  console.log(`✅ Successfully parsed ${heroes.length} heroes`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} entries due to parsing issues`);
  }
  
  return heroes;
}

/**
 * Generates JSON output matching existing format
 */
function generateJSON(heroes) {
  return {
    heroes: heroes
  };
}

/**
 * Saves JSON to file with backup
 */
function saveJSON(jsonData, outputPath) {
  try {
    // Create backup of existing file
    if (fs.existsSync(outputPath)) {
      const backupPath = outputPath.replace('.json', '.backup.json');
      fs.copyFileSync(outputPath, backupPath);
      console.log(`📦 Created backup: ${backupPath}`);
    }
    
    // Write new file
    const jsonString = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(outputPath, jsonString, 'utf8');
    console.log(`💾 Saved ${jsonData.heroes.length} heroes to ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error saving JSON: ${error.message}`);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🦸 Google Doc to Heroes JSON Generator');
  console.log('=====================================');
  
  try {
    // Fetch document
    const docText = await fetchGoogleDoc(GOOGLE_DOC_URL);
    
    // Parse heroes
    const heroes = parseHeroesData(docText);
    
    if (heroes.length === 0) {
      throw new Error('No heroes were successfully parsed from the document');
    }
    
    // Generate JSON
    const jsonData = generateJSON(heroes);
    
    // Save to file
    const success = saveJSON(jsonData, OUTPUT_FILE);
    
    if (success) {
      console.log('🎉 Heroes JSON generation completed successfully!');
      console.log(`📊 Total heroes: ${heroes.length}`);
      
      // Show difficulty breakdown
      const breakdown = heroes.reduce((acc, hero) => {
        acc[hero.difficulty] = (acc[hero.difficulty] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Difficulty breakdown:', breakdown);
      
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log('🔄 Attempting to maintain existing heroes.json file...');
    
    // Check if fallback file exists
    if (fs.existsSync(FALLBACK_FILE)) {
      console.log('✅ Existing heroes.json file preserved');
    } else {
      console.error('💥 No existing heroes.json file found - manual intervention required');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchGoogleDoc,
  parseHeroesData,
  generateJSON,
  extractAnimalTheme,
  normalizeDifficulty
};