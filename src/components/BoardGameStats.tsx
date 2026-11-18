import React from 'react';
import CalendarHeatmap from './charts/CalendarHeatmap';
import MonthlyColumns from './charts/MonthlyColumns';
import RankedBars from './charts/RankedBars';
import { formatMonthYear, formatShortDay, plural } from '../lib/dates';
import {
  busiestDay,
  firstPlayDate,
  latestPlayDate,
  mostPlayed,
  playsByDay,
  playsByMonth,
  playsInYear,
  totalGames,
  totalPlays,
} from '../lib/plays';

const BoardGameStats = () => {
  if (!latestPlayDate) return null;

  const year = latestPlayDate.slice(0, 4);
  const tiles = [
    { label: 'Plays logged', value: totalPlays, note: `since ${formatMonthYear(firstPlayDate)}` },
    { label: 'Different games', value: totalGames, note: 'played at least once' },
    { label: `Plays in ${year}`, value: playsInYear(year), note: 'so far' },
    ...(busiestDay ? [{ label: 'Busiest day', value: busiestDay.total, note: formatShortDay(busiestDay.date) }] : []),
  ];

  const topGames = mostPlayed.slice(0, 10).map((game) => ({
    key: game.id,
    label: game.name,
    value: game.plays,
    href: game.href,
    tipValue: plural(game.plays, 'play', 'plays'),
    tipDetail: [game.name, `Last played ${formatShortDay(game.lastPlayed)}`],
  }));

  return (
    <section className="mt-12">
      <h2 className="text-2xl mb-2">Play History</h2>
      <hr className="mb-4" />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <dt className="text-sm text-gray-500">{tile.label}</dt>
            <dd className="text-3xl">{tile.value.toLocaleString('en-GB')}</dd>
            <dd className="text-xs text-gray-500">{tile.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <CalendarHeatmap days={playsByDay} initialEnd={latestPlayDate} />
      </div>

      <div className="grid sm:grid-cols-2 gap-12 mt-8">
        <div>
          <h3 className="text-lg mb-3">Plays per month</h3>
          <MonthlyColumns
            data={playsByMonth}
            unit={['play', 'plays']}
            currentMonth={latestPlayDate.slice(0, 7)}
            caption="Board game plays per month"
          />
        </div>
        <div>
          <h3 className="text-lg mb-3">Most played</h3>
          <RankedBars rows={topGames} />
        </div>
      </div>
    </section>
  );
};

export default BoardGameStats;
