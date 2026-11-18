import React from 'react';
import Cover from './Cover';
import { formatShortDay, plural } from '../lib/dates';
import { recentGames, statsByGame } from '../lib/plays';

const idFromHref = (href: string) => href.split('/').pop() ?? '';

const BoardGameGeekWidget = () => (
  <>
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
      {recentGames.map((game) => {
        const stats = statsByGame.get(game.id ?? idFromHref(game.href));
        const details = stats
          ? [plural(stats.plays, 'play', 'plays'), `Last played ${formatShortDay(stats.lastPlayed)}`]
          : [];
        return <Cover key={game.href} href={game.href} imgSrc={game.imgSrc} title={game.name} details={details} />;
      })}
    </div>
    <div className="flex items-center justify-center mt-4">
      <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-500">
        <img src="/powered-by-bgg-rgb.svg" alt="BoardGameGeek Logo" style={{ height: '24px' }} />
      </a>
    </div>
  </>
);

export default BoardGameGeekWidget;
