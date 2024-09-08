import React, { useEffect, useState } from 'react';

interface BoardGame {
  name: string;
  href: string;
  imgSrc: string;
}

const BoardGameGeekWidget = () => {
  const [boardGames, setBoardGames] = useState<BoardGame[]>([]);

  useEffect(() => {
    (async () => {
      const parser = new DOMParser();
      
      const plays = await (await fetch('https://boardgamegeek.com/xmlapi2/plays?username=lena205')).text();
      const playsDocument = parser.parseFromString(plays, "text/xml");
      const playedGames = playsDocument.querySelectorAll('play item');
      const playedGameIds: string[] = [];
      playedGames.forEach(game => {
        const gameId = game.getAttribute('objectid');
        if (!gameId) return;
        if (playedGameIds.length >= 12) return;
        if (playedGameIds.includes(gameId)) return;
        playedGameIds.push(gameId);
      });

      const things = await (await fetch(`https://boardgamegeek.com/xmlapi2/things?id=${encodeURIComponent(playedGameIds.join(','))}`)).text();
      const thingsDocument = parser.parseFromString(things, "text/xml");
      const thingsGames = thingsDocument.querySelectorAll('item');
      const thingsGamesParsed: BoardGame[] = [];
      thingsGames.forEach(game => {
        const name = game.querySelector('name[type="primary"]')?.textContent ?? 'Unknown name';
        const imgSrc = game.querySelector('image')?.textContent ?? '/profile-pic.jpg';
        const href = `https://boardgamegeek.com/boardgame/${game.getAttribute('id')}`;
        thingsGamesParsed.push({ name, href, imgSrc });
      });

      setBoardGames(thingsGamesParsed);
    })();
  }, []);

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
      {boardGames.map((boardGame) => (
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
  );
};

export default BoardGameGeekWidget;