import express from 'express';
import { db } from '../../database/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/heroes', async (_req, res) => {
  try {
    const heroes = await db.all(`
      SELECT h.*, 
             COUNT(i.id) as image_count,
             GROUP_CONCAT(i.image_path) as image_paths
      FROM superheroes h
      LEFT JOIN superhero_images i ON h.id = i.superhero_id
      WHERE h.is_active = 1
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    res.json(heroes);
  } catch (error) {
    console.error('Error fetching heroes:', error);
    res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

router.get('/heroes/:id', async (req, res) => {
  try {
    const hero = await db.get(`
      SELECT * FROM superheroes WHERE id = ? AND is_active = 1
    `, [req.params.id]);
    
    if (!hero) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    
    const images = await db.all(`
      SELECT * FROM superhero_images WHERE superhero_id = ?
    `, [req.params.id]);
    
    res.json({ ...hero, images });
  } catch (error) {
    console.error('Error fetching hero:', error);
    res.status(500).json({ error: 'Failed to fetch hero' });
  }
});

router.post('/heroes', async (req, res) => {
  try {
    const {
      superhero_name,
      real_name,
      powers,
      origin,
      trivia,
      animal_theme,
      hero_inspiration,
      difficulty = 'Medium'
    } = req.body;
    
    if (!superhero_name) {
      return res.status(400).json({ error: 'Superhero name is required' });
    }
    
    const result = await db.run(`
      INSERT INTO superheroes (
        superhero_name, real_name, powers, origin, trivia,
        animal_theme, hero_inspiration, difficulty, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      superhero_name,
      real_name,
      powers,
      origin,
      trivia,
      animal_theme,
      hero_inspiration,
      difficulty
    ]);
    
    res.status(201).json({ id: result.lastID, message: 'Hero created successfully' });
  } catch (error) {
    console.error('Error creating hero:', error);
    res.status(500).json({ error: 'Failed to create hero' });
  }
});

router.put('/heroes/:id', async (req, res) => {
  try {
    const {
      superhero_name,
      real_name,
      powers,
      origin,
      trivia,
      animal_theme,
      hero_inspiration,
      difficulty
    } = req.body;
    
    const result = await db.run(`
      UPDATE superheroes SET
        superhero_name = ?, real_name = ?, powers = ?, origin = ?,
        trivia = ?, animal_theme = ?, hero_inspiration = ?, difficulty = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `, [
      superhero_name,
      real_name,
      powers,
      origin,
      trivia,
      animal_theme,
      hero_inspiration,
      difficulty,
      req.params.id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    
    res.json({ message: 'Hero updated successfully' });
  } catch (error) {
    console.error('Error updating hero:', error);
    res.status(500).json({ error: 'Failed to update hero' });
  }
});

router.delete('/heroes/:id', async (req, res) => {
  try {
    const result = await db.run(`
      UPDATE superheroes SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `, [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hero not found' });
    }
    
    res.json({ message: 'Hero deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero:', error);
    res.status(500).json({ error: 'Failed to delete hero' });
  }
});

export default router;