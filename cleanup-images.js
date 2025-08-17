#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read heroes.json
const heroesData = JSON.parse(fs.readFileSync('./public/heroes.json', 'utf8'));
const heroes = heroesData.heroes || [];

// Get all image files in public/images
const imagesDir = './public/images';
const imageFiles = fs.readdirSync(imagesDir).filter(file => 
  /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
);

// Extract used images from heroes database
const usedImages = new Set();
heroes.forEach(hero => {
  if (hero.imagePath && hero.imagePath.startsWith('./images/')) {
    const imageName = hero.imagePath.replace('./images/', '');
    usedImages.add(imageName);
  }
});

console.log('=== IMAGE CLEANUP ANALYSIS ===\n');

// Find used images
console.log('USED IMAGES:');
const usedImagesList = Array.from(usedImages).sort();
usedImagesList.forEach(img => {
  console.log(`  ✓ ${img}`);
});

console.log(`\nTotal used images: ${usedImagesList.length}\n`);

// Find unused images
console.log('UNUSED IMAGES (can be removed):');
const unusedImages = imageFiles.filter(file => !usedImages.has(file));
unusedImages.sort().forEach(img => {
  console.log(`  ✗ ${img}`);
});

console.log(`\nTotal unused images: ${unusedImages.length}\n`);

// Find potential duplicates based on similar names
console.log('POTENTIAL DUPLICATES:');
const duplicateGroups = new Map();

imageFiles.forEach(file => {
  // Normalize filename for comparison
  const normalized = file.toLowerCase()
    .replace(/[._-]/g, '')
    .replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
  
  if (!duplicateGroups.has(normalized)) {
    duplicateGroups.set(normalized, []);
  }
  duplicateGroups.get(normalized).push(file);
});

duplicateGroups.forEach((files, normalized) => {
  if (files.length > 1) {
    console.log(`  Group: ${files.join(', ')}`);
    // Show which ones are used vs unused
    files.forEach(file => {
      const status = usedImages.has(file) ? '✓ USED' : '✗ UNUSED';
      console.log(`    - ${file} (${status})`);
    });
    console.log('');
  }
});

// Generate removal commands
if (unusedImages.length > 0) {
  console.log('\n=== REMOVAL COMMANDS ===');
  console.log('Run these commands to remove unused images:\n');
  unusedImages.forEach(img => {
    console.log(`rm "./public/images/${img}"`);
  });
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total images: ${imageFiles.length}`);
console.log(`Used images: ${usedImagesList.length}`);
console.log(`Unused images: ${unusedImages.length}`);
console.log(`Space savings: ${unusedImages.length} files can be removed`);