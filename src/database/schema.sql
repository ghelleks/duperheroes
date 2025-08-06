-- Superheroes table
CREATE TABLE IF NOT EXISTS superheroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  superhero_name TEXT NOT NULL,
  real_name TEXT,
  powers TEXT,
  origin TEXT,
  trivia TEXT,
  animal_theme TEXT,
  hero_inspiration TEXT,
  difficulty TEXT DEFAULT 'Medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- Images table
CREATE TABLE IF NOT EXISTS superhero_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  superhero_id INTEGER,
  image_path TEXT NOT NULL,
  image_name TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (superhero_id) REFERENCES superheroes(id)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game statistics table
CREATE TABLE IF NOT EXISTS game_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  game_mode TEXT NOT NULL,
  score INTEGER,
  time_taken INTEGER,
  questions_answered INTEGER,
  correct_answers INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_superheroes_difficulty ON superheroes(difficulty);
CREATE INDEX IF NOT EXISTS idx_superheroes_active ON superheroes(is_active);
CREATE INDEX IF NOT EXISTS idx_superhero_images_hero_id ON superhero_images(superhero_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_mode ON game_stats(game_mode);