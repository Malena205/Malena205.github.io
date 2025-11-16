import React, { useEffect, useState } from 'react';

interface BoardGame {
  name: string;
  href: string;
  imgSrc: string;
}

const BoardGameGeekWidget = () => {
  const [boardGames, setBoardGames] = useState<BoardGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/bgg-games.json');
        if (!response.ok) {
          throw new Error('Failed to load games data');
        }
        const games: BoardGame[] = await response.json();
        setBoardGames(games);
      } catch (error) {
        console.error('Error loading BGG games:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
        {[...Array(12)].map((_, index) => (
          <div 
            key={index}
            className={`aspect-square rounded bg-gray-200 animate-pulse`}
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
        {boardGames.map((boardGame: BoardGame) => (
          <a
            href={boardGame.href}
            key={boardGame.href}
            rel="noopener"
            className="flex flex-col justify-end"
          >
            <img src={boardGame.imgSrc} alt={boardGame.name} className="rounded overflow-hidden w-full object-cover transition hover:scale-105 shadow-md shadow-gray-400" />
          </a>
        ))}
      </div>
      <div className="flex items-center justify-center mt-4">
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-500">
          <img src="/powered-by-bgg-rgb.svg" alt="BoardGameGeek Logo" style={{ height: '24px' }} />
        </a>
      </div>
    </>
  );
};

export default BoardGameGeekWidget;
