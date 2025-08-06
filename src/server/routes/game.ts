import express from 'express';
import { db } from '../../database/database';

const router = express.Router();

router.get('/heroes/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 1;
    const difficulty = req.query.difficulty as string;
    
    let query = `
      SELECT h.id, h.superhero_name, h.real_name, h.powers, 
             h.origin, h.trivia, h.animal_theme, h.hero_inspiration, h.difficulty,
             i.image_path
      FROM superheroes h
      LEFT JOIN superhero_images i ON h.id = i.superhero_id AND i.is_primary = 1
      WHERE h.is_active = 1
    `;
    
    const params: any[] = [];
    
    if (difficulty && difficulty !== 'all') {
      query += ' AND h.difficulty = ?';
      params.push(difficulty);
    }
    
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);
    
    const heroes = await db.all(query, params);
    res.json(heroes);
  } catch (error) {
    console.error('Error fetching random heroes:', error);
    res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

router.get('/heroes/choices/:heroId', async (req, res) => {
  try {
    const heroId = req.params.heroId;
    const count = parseInt(req.query.count as string) || 4;
    
    const correctHero = await db.get(`
      SELECT superhero_name FROM superheroes WHERE id = ? AND is_active = 1
    `, [heroId]);
    
    if (!correctHero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    
    const wrongChoices = await db.all(`
      SELECT superhero_name FROM superheroes 
      WHERE id != ? AND is_active = 1 
      ORDER BY RANDOM() 
      LIMIT ?
    `, [heroId, count - 1]);
    
    const choices = [correctHero, ...wrongChoices]
      .map(hero => hero.superhero_name)
      .sort(() => Math.random() - 0.5);
    
    res.json({
      correct_answer: correctHero.superhero_name,
      choices
    });
  } catch (error) {
    console.error('Error generating choices:', error);
    res.status(500).json({ error: 'Failed to generate choices' });
  }
});

router.post('/stats', async (req, res) => {
  try {
    const {
      session_id,
      game_mode,
      score,
      time_taken,
      questions_answered,
      correct_answers
    } = req.body;
    
    const result = await db.run(`
      INSERT INTO game_stats (
        session_id, game_mode, score, time_taken, 
        questions_answered, correct_answers
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      session_id,
      game_mode,
      score,
      time_taken,
      questions_answered,
      correct_answers
    ]);
    
    res.status(201).json({ 
      id: result.lastID, 
      message: 'Stats recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording stats:', error);
    res.status(500).json({ error: 'Failed to record stats' });
  }
});

router.get('/stats/leaderboard', async (req, res) => {
  try {
    const gameMode = req.query.mode as string || 'beat_the_clock';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stats = await db.all(`
      SELECT session_id, score, time_taken, questions_answered, correct_answers, created_at
      FROM game_stats 
      WHERE game_mode = ?
      ORDER BY score DESC, time_taken ASC
      LIMIT ?
    `, [gameMode, limit]);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;