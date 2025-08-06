import { db } from './database';
import heroesData from './animal-heroes-data.json';

export async function importHeroes(): Promise<void> {
  console.log('Importing animal heroes from JSON data...');
  
  try {
    // Clear existing heroes first
    await db.run('DELETE FROM superheroes');
    console.log('Cleared existing heroes');
    
    // Import new heroes
    for (const hero of heroesData.heroes) {
      try {
        const result = await db.run(
          `INSERT INTO superheroes (
            superhero_name, real_name, powers, origin, trivia, 
            animal_theme, hero_inspiration, difficulty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hero.superhero_name,
            hero.real_name,
            hero.powers,
            hero.origin,
            hero.trivia,
            hero.animal_theme,
            hero.hero_inspiration,
            hero.difficulty
          ]
        );
        console.log(`✅ Added ${hero.superhero_name} (ID: ${result.lastID})`);
      } catch (error) {
        console.error(`❌ Error adding ${hero.superhero_name}:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully imported ${heroesData.heroes.length} animal heroes!`);
    
    // Show summary stats
    const counts = await db.all(`
      SELECT difficulty, COUNT(*) as count 
      FROM superheroes 
      WHERE is_active = 1 
      GROUP BY difficulty
    `);
    
    console.log('\n📊 Heroes by difficulty:');
    counts.forEach(row => {
      console.log(`  ${row.difficulty}: ${row.count} heroes`);
    });
    
  } catch (error) {
    console.error('Failed to import heroes:', error);
    throw error;
  }
}

if (require.main === module) {
  db.init()
    .then(() => importHeroes())
    .then(() => db.close())
    .then(() => {
      console.log('\n✨ Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}