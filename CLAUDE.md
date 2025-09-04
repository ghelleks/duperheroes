# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"DuperHeroes" is a single-page web application featuring a superhero identification game with satirical animal-themed superheroes. Players compete in a "Beat the Clock" mode where they have 60 seconds to identify as many animal superheroes as possible. The application is a static site designed for GitHub Pages deployment.

## Development Commands

### Local Development
- `npm run serve` - Serve static files locally (uses npx http-server)
- `npm run serve:python` - Alternative Python server
- No build process required - direct file serving

### MCP Servers
Project uses MCP (Model Context Protocol) servers for enhanced capabilities:
- **Fetch Server**: Web content fetching and conversion for Google Doc integration
- **Filesystem Server**: Enhanced file system operations
- Configuration: `.mcp.json` (automatically loaded by Claude Code)

### Deployment
- `git push origin main` - Triggers automatic GitHub Pages deployment
- GitHub Actions workflow deploys from `public/` directory
- Live at: https://ghelleks.github.io/duperheroes

## Architecture

### Static Single-Page Application
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Styling**: Tailwind CSS via CDN
- **Database**: JSON file (`public/heroes.json`)
- **Deployment**: GitHub Pages with GitHub Actions
- **Storage**: localStorage for personal best tracking

### Project Structure
```
public/
├── index.html          # Single-page application with embedded JavaScript
├── debug.html          # Debug console for build monitoring
├── heroes.json         # Character database (194 heroes)
├── images/             # Hero character images
└── debug/              # Debug output files

scripts/
├── fetch-heroes.js     # Google Doc to JSON converter
└── audit-images.js     # Image coverage audit tool

.github/workflows/
└── deploy.yml          # Automatic GitHub Pages deployment

docs/adr/              # Architectural Decision Records
animal_heroes_database.md # Source data for character creation
README.md              # Project documentation
CLAUDE.md             # This file
```

### Application Architecture
- **Game State Management**: Vanilla JavaScript ES6 class (`GameState`)
- **Data Loading**: Fetch API with fallback mock data
- **UI Rendering**: Template literals with dynamic content
- **Event Handling**: Direct onclick attributes and method calls

## Character Database

The game features 50 satirical animal-themed superheroes that parody Marvel characters:
- **Difficulty Levels**: Easy (4), Medium (33), Hard (13)
- **Animal Types**: Mammals (34), Birds (9), Reptiles/Amphibians (5), Sea Creatures (2)
- **Examples**: Captain Canine (Captain America), Hulk-a-Hopper (Hulk), Spider-Swinger (Spider-Man)

Each character includes:
- `superhero_name`: Display name for the game
- `real_name`: Satirical real identity
- `powers`: Humorous list of abilities
- `origin`: Comedic backstory
- `trivia`: Fun facts about the character
- `animal_theme`: Animal type (used for emoji mapping)
- `hero_inspiration`: Original Marvel character
- `difficulty`: Easy/Medium/Hard for game balance

### Emoji Mapping
The game automatically displays animal emojis for each character based on their `animal_theme`. The mapping is defined in the `getAnimalEmoji()` function in `index.html`.

## Game Features

### Beat the Clock Mode
- **Time Limit**: 60 seconds
- **Scoring**: 10 points base + 2 points per streak
- **Questions**: Multiple choice with 4 options
- **Feedback**: Instant correct/incorrect with character trivia
- **Personal Best**: Saved in localStorage

### Game Mechanics
- Random hero selection from 50-character database
- Multiple choice generation (1 correct + 3 random)
- Streak bonuses for consecutive correct answers
- Real-time timer with automatic game end
- Question count and accuracy tracking

## Technical Implementation

### Core Technologies
- **Vanilla JavaScript**: No frameworks or build tools
- **Tailwind CSS**: Utility-first styling via CDN
- **JSON Database**: Static file with character data
- **localStorage**: Personal best persistence
- **GitHub Actions**: Automated deployment

### Browser Compatibility
- Modern browsers with ES6 support
- Fetch API support
- localStorage support
- CSS Grid and Flexbox

### Performance Considerations
- Single file application for fast loading
- CDN-served Tailwind CSS
- Minimal JavaScript footprint
- Fallback data prevents loading failures

## Development Guidelines

### Adding New Characters
1. Edit `public/heroes.json` to add character data
2. Update emoji mapping in `getAnimalEmoji()` function if needed
3. Test locally with a static server
4. Commit and push to trigger deployment

### File Structure Guidelines
- Keep all game logic in `public/index.html`
- Store character data in `public/heroes.json`
- Update documentation in `README.md` as needed
- Use `animal_heroes_database.md` as character reference

### Deployment Process
- GitHub Actions automatically deploys on push to production branch
- Workflow serves `public/` directory to GitHub Pages
- Live site updates within minutes of push
- No build process required - direct file serving