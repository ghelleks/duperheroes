# 🦸‍♂️ DuperHeroes - Animal Superhero Game

A fun, single-page web application where you test your knowledge of satirical animal-themed superheroes! Built as a static site that runs entirely in the browser.

## 🎮 Play Now

**Live Game:** https://ghelleks.github.io/duperheroes

## 🎯 Game Features

- **Beat the Clock Mode**: 60-second animal superhero identification challenge
- **190+ Unique Characters**: Satirical animal parodies of popular superheroes
- **Multiple Choice Quiz**: 4 options per question with instant feedback
- **Scoring System**: Points with streak bonuses for consecutive correct answers
- **Personal Best Tracking**: Local storage saves your high scores
- **Educational Content**: Learn fun trivia about each character
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🦸‍♂️ Featured Characters

- **Captain Canine** (Captain America parody) - Golden retriever with frisbee shield
- **Hulk-a-Hopper** (Hulk parody) - Opera-singing polka-dotted frog
- **Wolverine Whiskers** (Wolverine parody) - Cat with adamantium claws on his 4th life
- **Spider-Swinger** (Spider-Man parody) - Monkey with banana spider-sense
- **Doctor Strange-topus** (Doctor Strange parody) - Mystical octopus surgeon
- **Thor-ough Bred** (Thor parody) - Asgardian horse banished for trying to marry the Moon
- And 180+ more hilarious animal heroes!

## 🛠️ Technology

- **Pure HTML/CSS/JavaScript** - No frameworks, just vanilla web technologies
- **Tailwind CSS** - Via CDN for styling
- **JSON Database** - Static heroes.json file with character data (auto-generated from Google Doc)
- **GitHub Pages** - Automatically deployed static hosting
- **Local Storage** - Client-side progress tracking

## 🚀 Local Development

1. Clone the repository:
```bash
git clone https://github.com/ghelleks/duperheroes.git
cd duperheroes
```

2. Install dependencies (for hero data fetching):
```bash
npm install
```

3. Serve the static files:
```bash
# Option 1: Simple HTTP server
npx http-server public -p 8080 -o

# Option 2: Python server
cd public && python -m http.server 8080

# Option 3: Any static file server
```

4. Open http://localhost:8080 in your browser

## 📁 Project Structure

```
public/
├── index.html          # Single-page application
├── heroes.json         # Character database (auto-generated)
└── (GitHub Pages serves from this directory)

scripts/
└── fetch-heroes.js     # Google Doc to JSON converter

.github/workflows/
└── deploy.yml          # Automatic GitHub Pages deployment
```

## 🎨 Game Mechanics

### Scoring
- **Base Points**: 10 points per correct answer
- **Streak Bonus**: +2 points per consecutive correct answer
- **Time Limit**: 60 seconds total
- **Personal Best**: Saved locally in browser

### Difficulty Levels
- **Easy**: Most recognizable characters
- **Medium**: Well-known with animal twists  
- **Hard**: Complex parodies and lesser-known characters
- Character distribution automatically adjusts based on Google Doc content

## 🔧 Data Management

### Google Doc Integration

Hero data is automatically fetched from a Google Document during build time:

- **Source**: [Shared Google Doc](https://docs.google.com/document/d/1EqPn6k6UicD8uTSbKQ0z4SuBKC19UPI-GC1PAjy3VUY/edit) with 190+ characters
- **Build Process**: GitHub Actions automatically fetches latest data on deployment
- **Local Development**: Run `npm run fetch-heroes` to update hero data locally
- **Fallback**: Existing heroes.json preserved if fetch fails

### Manual Hero Updates

For local testing, you can manually edit `public/heroes.json` and add new character objects:

```json
{
  "superhero_name": "New Hero Name",
  "real_name": "Real Identity",
  "powers": "List of powers",
  "origin": "How they got their powers",
  "trivia": "Fun fact about the character",
  "animal_theme": "Animal Type",
  "hero_inspiration": "Original superhero",
  "difficulty": "Easy|Medium|Hard"
}
```

### Emoji Support

The game automatically maps animal themes to emojis. Add new mappings in the `getAnimalEmoji()` function in `index.html`.

### Development Commands

```bash
# Fetch latest hero data from Google Doc
npm run fetch-heroes

# Run full build process (includes hero fetching)
npm run build

# Test hero data fetching and parsing
npm run build:heroes
```

## 🚀 Deployment

The site automatically deploys to GitHub Pages when you push to the main branch. The GitHub Action:

1. Fetches latest hero data from Google Doc
2. Builds and publishes the `public/` directory
3. Ensures heroes.json is always up-to-date with the latest characters

### Manual Deployment

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"
4. Push to main branch - automatic deployment!

## 📝 License

MIT License - feel free to use this code for your own projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your satirical animal superhero
4. Submit a pull request

## 🎉 Credits

- Game concept and character designs: Original satirical parodies
- Built with love for the superhero and animal communities
- Inspired by the joy of terrible puns and animal humor

---

**Have fun identifying these ridiculous animal superheroes!** 🦸‍♂️🐶🐸🐱