import express from 'express';
import { db } from '../../database/database';

const router = express.Router();

router.get('/heroes/random', async (_req, res) => {
  try {
    const count = 1;
    
    const heroes = await db.all(`
      SELECT h.id, h.superhero_name, h.real_name, h.powers, 
             h.origin, h.trivia, h.animal_theme, h.hero_inspiration, h.difficulty
      FROM superheroes h
      WHERE h.is_active = 1
      ORDER BY RANDOM() 
      LIMIT ?
    `, [count]);
    
    return res.json(heroes);
  } catch (error) {
    console.error('Error fetching random heroes:', error);
    return res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

router.get('/heroes/choices/:heroId', async (req, res) => {
  try {
    const heroId = req.params.heroId;
    const count = 4;
    
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
    
    return res.json({
      correct_answer: correctHero.superhero_name,
      choices
    });
  } catch (error) {
    console.error('Error generating choices:', error);
    return res.status(500).json({ error: 'Failed to generate choices' });
  }
});

export default router;