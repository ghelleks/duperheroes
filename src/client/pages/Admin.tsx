import React, { useState, useEffect } from 'react';

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
  image_count: number;
  image_paths: string;
}

function Admin() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroes();
  }, []);

  const fetchHeroes = async () => {
    try {
      const response = await fetch('/api/admin/heroes');
      const data = await response.json();
      setHeroes(data);
    } catch (error) {
      console.error('Error fetching heroes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (heroData: Partial<Hero>) => {
    try {
      const url = selectedHero 
        ? `/api/admin/heroes/${selectedHero.id}`
        : '/api/admin/heroes';
      
      const method = selectedHero ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heroData),
      });

      if (response.ok) {
        await fetchHeroes();
        setSelectedHero(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving hero:', error);
    }
  };

  const handleDelete = async (heroId: number) => {
    if (window.confirm('Are you sure you want to delete this hero?')) {
      try {
        const response = await fetch(`/api/admin/heroes/${heroId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchHeroes();
          setSelectedHero(null);
        }
      } catch (error) {
        console.error('Error deleting hero:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={() => {
              setSelectedHero(null);
              setIsEditing(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Hero
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Heroes List</h2>
            <div className="bg-white rounded-lg shadow">
              {heroes.map((hero) => (
                <div
                  key={hero.id}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedHero(hero);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{hero.superhero_name}</h3>
                      <p className="text-gray-600">{hero.real_name}</p>
                      <p className="text-sm text-gray-500">
                        {hero.animal_theme} • {hero.difficulty}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHero(hero);
                          setIsEditing(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(hero.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {isEditing ? (
              <HeroForm
                hero={selectedHero}
                onSave={handleSave}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedHero(null);
                }}
              />
            ) : selectedHero ? (
              <HeroDetails hero={selectedHero} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a hero to view details or click "Add New Hero" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroForm({ 
  hero, 
  onSave, 
  onCancel 
}: { 
  hero: Hero | null; 
  onSave: (data: Partial<Hero>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    superhero_name: hero?.superhero_name || '',
    real_name: hero?.real_name || '',
    powers: hero?.powers || '',
    origin: hero?.origin || '',
    trivia: hero?.trivia || '',
    animal_theme: hero?.animal_theme || '',
    hero_inspiration: hero?.hero_inspiration || '',
    difficulty: hero?.difficulty || 'Medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {hero ? 'Edit Hero' : 'Add New Hero'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Superhero Name</label>
          <input
            type="text"
            required
            value={formData.superhero_name}
            onChange={(e) => setFormData({ ...formData, superhero_name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Real Name</label>
          <input
            type="text"
            value={formData.real_name}
            onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Powers</label>
          <textarea
            value={formData.powers}
            onChange={(e) => setFormData({ ...formData, powers: e.target.value })}
            className="w-full border rounded px-3 py-2 h-20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Origin</label>
          <textarea
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            className="w-full border rounded px-3 py-2 h-20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Animal Theme</label>
          <input
            type="text"
            value={formData.animal_theme}
            onChange={(e) => setFormData({ ...formData, animal_theme: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hero Inspiration</label>
          <input
            type="text"
            value={formData.hero_inspiration}
            onChange={(e) => setFormData({ ...formData, hero_inspiration: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function HeroDetails({ hero }: { hero: Hero }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Hero Details</h2>
      <div className="space-y-3">
        <div>
          <strong>Superhero Name:</strong> {hero.superhero_name}
        </div>
        <div>
          <strong>Real Name:</strong> {hero.real_name}
        </div>
        <div>
          <strong>Powers:</strong> {hero.powers}
        </div>
        <div>
          <strong>Origin:</strong> {hero.origin}
        </div>
        <div>
          <strong>Trivia:</strong> {hero.trivia}
        </div>
        <div>
          <strong>Animal Theme:</strong> {hero.animal_theme}
        </div>
        <div>
          <strong>Hero Inspiration:</strong> {hero.hero_inspiration}
        </div>
        <div>
          <strong>Difficulty:</strong> {hero.difficulty}
        </div>
        <div>
          <strong>Images:</strong> {hero.image_count || 0}
        </div>
      </div>
    </div>
  );
}

export default Admin;