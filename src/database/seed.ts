import { db } from './database';

const superheroes = [
  {
    superhero_name: 'Dum Dog',
    real_name: 'Steve Rover',
    powers: 'Enhanced loyalty, frisbee shield mastery, super barking, patriotic tail wagging',
    origin: 'A loyal golden retriever who gained super strength after being injected with Super Soldier Serum meant for military dogs',
    trivia: 'Can catch any frisbee thrown within a 100-yard radius and his bark can shatter glass',
    animal_theme: 'Dog',
    hero_inspiration: 'Captain America',
    difficulty: 'Easy'
  },
  {
    superhero_name: 'Doy Dog',
    real_name: 'James "Bucky" Barker',
    powers: 'Bionic paw, enhanced sniffing, tactical howling, metal bone throwing',
    origin: 'Dum Dog\'s best friend who fell from a train but was saved and given a cybernetic paw replacement',
    trivia: 'His bionic paw can crush steel and he remembers every scent he has ever smelled',
    animal_theme: 'Wolf',
    hero_inspiration: 'Bucky Barnes/Winter Soldier',
    difficulty: 'Medium'
  },
  {
    superhero_name: 'Fat Frog',
    real_name: 'Bruce Hopper',
    powers: 'Incredible jumping strength, lily pad smashing, toxic tongue lash, amphibious rage',
    origin: 'A mild-mannered scientist who transforms into a giant green frog when angry after a gamma radiation accident',
    trivia: 'Can leap over buildings in a single bound and his tongue can extend up to 50 feet',
    animal_theme: 'Frog',
    hero_inspiration: 'The Hulk',
    difficulty: 'Easy'
  },
  {
    superhero_name: 'Krazy Koala',
    real_name: 'Thaddeus "Thunderbolt" Ross',
    powers: 'Eucalyptus-fueled rage, tree climbing agility, pouch storage, marsupial strength',
    origin: 'A military general who became a red koala after exposure to gamma radiation while hunting Fat Frog',
    trivia: 'Stores unlimited weapons in his pouch and can sleep 20 hours a day while still fighting crime',
    animal_theme: 'Koala',
    hero_inspiration: 'Red Hulk',
    difficulty: 'Hard'
  },
  {
    superhero_name: 'Claw Cat',
    real_name: 'Logan Whiskers',
    powers: 'Retractable adamantium claws, enhanced senses, nine lives, purr healing factor',
    origin: 'A Canadian cat with metal claws and the ability to regenerate. Has a mysterious past and loves tuna',
    trivia: 'Has actually died 8 times but always comes back to life, and his purr can heal minor wounds',
    animal_theme: 'Cat',
    hero_inspiration: 'Wolverine',
    difficulty: 'Medium'
  },
  {
    superhero_name: 'Web Spider',
    real_name: 'Peter Parkour',
    powers: 'Web-spinning, wall-crawling, spider-sense tingling, eight-legged mobility',
    origin: 'A young spider who gained human intelligence after being bitten by a radioactive teenager',
    trivia: 'Can produce 6 different types of webbing and his spider-sense works like a GPS',
    animal_theme: 'Spider',
    hero_inspiration: 'Spider-Man',
    difficulty: 'Easy'
  },
  {
    superhero_name: 'Night Bat',
    real_name: 'Bruce Winger',
    powers: 'Echolocation, cave dwelling, wing gliding, guano gadgets, nocturnal vision',
    origin: 'A wealthy bat who fights crime in Gotham Cave after his parents were killed by a cat burglar',
    trivia: 'Uses his own guano to create explosive pellets and can navigate in complete darkness',
    animal_theme: 'Bat',
    hero_inspiration: 'Batman',
    difficulty: 'Easy'
  },
  {
    superhero_name: 'Steel Eagle',
    real_name: 'Tony Stark',
    powers: 'Flight mastery, steel talon suit, high-altitude combat, nest-building genius',
    origin: 'A brilliant eagle engineer who built a high-tech suit after being injured by hunters',
    trivia: 'Can fly at speeds over 200 mph and builds his nests from recycled metal scraps',
    animal_theme: 'Eagle',
    hero_inspiration: 'Iron Man',
    difficulty: 'Medium'
  },
  {
    superhero_name: 'Thunder Horse',
    real_name: 'Thor Stallion',
    powers: 'Lightning gallop, mjolnir horseshoe, storm summoning, mane of power',
    origin: 'An Asgardian horse prince who wields an enchanted horseshoe and controls thunder',
    trivia: 'His horseshoe can only be lifted by those who are pure of heart and his mane glows during storms',
    animal_theme: 'Horse',
    hero_inspiration: 'Thor',
    difficulty: 'Medium'
  },
  {
    superhero_name: 'Wonder Whale',
    real_name: 'Diana Princess',
    powers: 'Sonar communication, tidal wave creation, lasso of truth-telling songs, aquatic strength',
    origin: 'An Amazonian whale warrior princess who fights for ocean justice with her golden lasso',
    trivia: 'Can communicate with all sea creatures and her songs can make anyone tell the truth',
    animal_theme: 'Whale',
    hero_inspiration: 'Wonder Woman',
    difficulty: 'Hard'
  },
  {
    superhero_name: 'Flash Fish',
    real_name: 'Barry Albacore',
    powers: 'Super-speed swimming, time-stream navigation, water vortex creation, fin force',
    origin: 'A forensic fish scientist who gained super speed after being struck by lightning in his aquarium',
    trivia: 'Can swim faster than the speed of sound underwater and create whirlpools by swimming in circles',
    animal_theme: 'Fish',
    hero_inspiration: 'The Flash',
    difficulty: 'Medium'
  },
  {
    superhero_name: 'Green Gecko',
    real_name: 'Hal Jordan',
    powers: 'Wall-crawling, tail regeneration, color-changing camouflage, willpower constructs',
    origin: 'A test pilot gecko who found a mysterious green ring that grants him the power of will',
    trivia: 'Can change color to match any environment and his tail grows back stronger each time it\'s lost',
    animal_theme: 'Gecko',
    hero_inspiration: 'Green Lantern',
    difficulty: 'Hard'
  }
];

export async function seedDatabase(): Promise<void> {
  console.log('Seeding database with superhero data...');
  
  for (const hero of superheroes) {
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
      console.log(`Added ${hero.superhero_name} with ID: ${result.lastID}`);
    } catch (error) {
      console.error(`Error adding ${hero.superhero_name}:`, error);
    }
  }
  
  console.log('Database seeding completed!');
}

if (require.main === module) {
  db.init()
    .then(() => seedDatabase())
    .then(() => db.close())
    .catch(console.error);
}