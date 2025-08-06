import React, { useState, useEffect, useCallback } from 'react';

interface Hero {
  id: number;
  superhero_name: string;
  real_name: string;
  powers: string;
  origin: string;
  trivia: string;
  animal_theme: string;
  hero_inspiration: string;
  difficulty: string;
  image_path: string;
}

interface GameChoices {
  correct_answer: string;
  choices: string[];
}

interface GameStats {
  score: number;
  timeRemaining: number;
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
}

function Game() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [currentHero, setCurrentHero] = useState<Hero | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    timeRemaining: 60,
    questionsAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'playing' && stats.timeRemaining > 0) {
      timer = setInterval(() => {
        setStats(prev => {
          if (prev.timeRemaining <= 1) {
            setGameState('finished');
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [gameState, stats.timeRemaining]);

  const mockHeroes = [
    {
      id: 1,
      superhero_name: 'Dum Dog',
      real_name: 'Steve Rover',
      powers: 'Enhanced loyalty, frisbee shield mastery, super barking, patriotic tail wagging',
      origin: 'A loyal golden retriever who gained super strength after being injected with Super Soldier Serum meant for military dogs',
      trivia: 'Can catch any frisbee thrown within a 100-yard radius and his bark can shatter glass',
      animal_theme: 'Dog',
      hero_inspiration: 'Captain America',
      difficulty: 'Easy',
      image_path: ''
    },
    {
      id: 2,
      superhero_name: 'Fat Frog',
      real_name: 'Bruce Hopper',
      powers: 'Incredible jumping strength, lily pad smashing, toxic tongue lash, amphibious rage',
      origin: 'A mild-mannered scientist who transforms into a giant green frog when angry after a gamma radiation accident',
      trivia: 'Can leap over buildings in a single bound and his tongue can extend up to 50 feet',
      animal_theme: 'Frog',
      hero_inspiration: 'The Hulk',
      difficulty: 'Easy',
      image_path: ''
    },
    {
      id: 3,
      superhero_name: 'Claw Cat',
      real_name: 'Logan Whiskers',
      powers: 'Retractable adamantium claws, enhanced senses, nine lives, purr healing factor',
      origin: 'A Canadian cat with metal claws and the ability to regenerate. Has a mysterious past and loves tuna',
      trivia: 'Has actually died 8 times but always comes back to life, and his purr can heal minor wounds',
      animal_theme: 'Cat',
      hero_inspiration: 'Wolverine',
      difficulty: 'Medium',
      image_path: ''
    },
    {
      id: 4,
      superhero_name: 'Web Spider',
      real_name: 'Peter Parkour',
      powers: 'Web-spinning, wall-crawling, spider-sense tingling, eight-legged mobility',
      origin: 'A young spider who gained human intelligence after being bitten by a radioactive teenager',
      trivia: 'Can produce 6 different types of webbing and his spider-sense works like a GPS',
      animal_theme: 'Spider',
      hero_inspiration: 'Spider-Man',
      difficulty: 'Easy',
      image_path: ''
    }
  ];

  const fetchRandomHero = useCallback(async () => {
    try {
      const response = await fetch('/api/game/heroes/random?count=1');
      const heroes = await response.json();
      
      if (heroes.length > 0) {
        const hero = heroes[0];
        setCurrentHero(hero);
        
        const choicesResponse = await fetch(`/api/game/heroes/choices/${hero.id}?count=4`);
        const choicesData: GameChoices = await choicesResponse.json();
        
        setChoices(choicesData.choices);
        setCorrectAnswer(choicesData.correct_answer);
        return;
      }
    } catch (error) {
      console.error('Error fetching hero, using fallback:', error);
    }
    
    // Fallback to mock data if API fails
    const randomHero = mockHeroes[Math.floor(Math.random() * mockHeroes.length)];
    setCurrentHero(randomHero);
    
    // Generate wrong choices
    const wrongChoices = mockHeroes
      .filter(h => h.id !== randomHero.id)
      .map(h => h.superhero_name)
      .slice(0, 3);
    
    const allChoices = [randomHero.superhero_name, ...wrongChoices]
      .sort(() => Math.random() - 0.5);
    
    setChoices(allChoices);
    setCorrectAnswer(randomHero.superhero_name);
  }, []);

  const startGame = () => {
    setGameState('playing');
    setStats({
      score: 0,
      timeRemaining: 60,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentStreak: 0,
    });
    setGameStartTime(Date.now());
    fetchRandomHero();
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === correctAnswer;
    const points = isCorrect ? (10 + stats.currentStreak * 2) : 0;
    
    setStats(prev => ({
      ...prev,
      score: prev.score + points,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
    }));

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer('');
      if (stats.timeRemaining > 0) {
        fetchRandomHero();
      }
    }, 2000);
  };

  const saveGameStats = async () => {
    try {
      const localStats = JSON.parse(localStorage.getItem('heroGameStats') || '{}');
      const personalBest = localStats.beatTheClockBest || 0;
      
      if (stats.score > personalBest) {
        localStorage.setItem('heroGameStats', JSON.stringify({
          ...localStats,
          beatTheClockBest: stats.score,
          lastPlayed: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  };

  useEffect(() => {
    if (gameState === 'finished') {
      saveGameStats();
    }
  }, [gameState]);

  const getPersonalBest = () => {
    const localStats = JSON.parse(localStorage.getItem('heroGameStats') || '{}');
    return localStats.beatTheClockBest || 0;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <h1 className="text-6xl font-bold mb-4">🦸‍♂️</h1>
          <h2 className="text-4xl font-bold mb-4">Beat the Clock</h2>
          <p className="text-xl mb-6">
            Identify as many animal superheroes as possible in 60 seconds!
          </p>
          <div className="mb-6 text-lg">
            <p>Personal Best: <span className="font-bold">{getPersonalBest()}</span> points</p>
          </div>
          <button
            onClick={startGame}
            className="bg-yellow-400 text-black px-8 py-3 rounded-lg text-xl font-semibold hover:bg-yellow-300 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const personalBest = getPersonalBest();
    const isNewRecord = stats.score > personalBest;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Time's Up!</h1>
          {isNewRecord && (
            <div className="text-2xl mb-4 text-yellow-300">🎉 New Personal Best! 🎉</div>
          )}
          <div className="bg-white/20 rounded-lg p-6 mb-6">
            <div className="text-3xl font-bold mb-2">{stats.score} Points</div>
            <div className="text-lg space-y-1">
              <div>Questions: {stats.questionsAnswered}</div>
              <div>Correct: {stats.correctAnswers}</div>
              <div>Accuracy: {stats.questionsAnswered > 0 ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0}%</div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="w-full bg-white/20 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-white/30 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600">
      {/* Game Header */}
      <div className="bg-white/10 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-white">
          <div className="text-xl font-bold">Score: {stats.score}</div>
          <div className="text-2xl font-bold">⏰ {stats.timeRemaining}s</div>
          <div className="text-xl">Streak: {stats.currentStreak}</div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentHero && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Hero Image */}
            <div className="h-64 bg-gray-200 flex items-center justify-center">
              {currentHero.image_path ? (
                <img
                  src={currentHero.image_path}
                  alt="Mystery Hero"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-6xl">{getAnimalEmoji(currentHero.animal_theme)}</div>
              )}
            </div>

            {/* Question */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center mb-6">Who is this superhero?</h2>
              
              {/* Answer Choices */}
              <div className="grid grid-cols-1 gap-3">
                {choices.map((choice, index) => {
                  let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ";
                  
                  if (showFeedback) {
                    if (choice === correctAnswer) {
                      buttonClass += "bg-green-500 text-white border-green-500";
                    } else if (choice === selectedAnswer && choice !== correctAnswer) {
                      buttonClass += "bg-red-500 text-white border-red-500";
                    } else {
                      buttonClass += "bg-gray-100 text-gray-600 border-gray-300";
                    }
                  } else {
                    buttonClass += "bg-gray-50 hover:bg-blue-50 border-gray-300 hover:border-blue-300 cursor-pointer";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(choice)}
                      disabled={showFeedback}
                      className={buttonClass}
                    >
                      <span className="font-semibold">{choice}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className="mt-6 p-4 rounded-lg bg-blue-50">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">
                      {selectedAnswer === correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>{currentHero.superhero_name}</strong> is {currentHero.real_name}
                    </div>
                    {currentHero.trivia && (
                      <div className="text-sm text-gray-600 mt-2">
                        💡 {currentHero.trivia}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getAnimalEmoji(animalTheme: string): string {
  const emojiMap: { [key: string]: string } = {
    'Dog': '🐕',
    'Wolf': '🐺',
    'Frog': '🐸',
    'Koala': '🐨',
    'Cat': '🐱',
    'Spider': '🕷️',
    'Bat': '🦇',
    'Eagle': '🦅',
    'Horse': '🐴',
    'Whale': '🐋',
    'Fish': '🐟',
    'Gecko': '🦎',
  };
  
  return emojiMap[animalTheme] || '🦸‍♂️';
}

export default Game;