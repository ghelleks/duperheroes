import React, { useState } from 'react';
import Game from './pages/Game';

type Page = 'home' | 'game';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  if (currentPage === 'game') {
    return <Game />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold mb-4">🦸‍♂️ DuperHeroes</h1>
        <p className="text-xl mb-8">Animal Superhero Identification Game</p>
        <div className="space-y-4">
          <button 
            onClick={() => setCurrentPage('game')}
            className="w-full bg-yellow-400 text-black px-8 py-3 rounded-lg text-xl font-semibold hover:bg-yellow-300 transition-colors"
          >
            Play Game
          </button>
        </div>
        <div className="mt-8 text-sm opacity-80">
          <p>Test your knowledge of satirical animal-themed superheroes!</p>
        </div>
      </div>
    </div>
  );
}

export default App;