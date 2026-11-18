import React, { useEffect, useMemo, useState } from 'react';
import CalendarHeatmap, { HEATMAP_LEVELS } from './charts/CalendarHeatmap';
import Columns, { monthColumns } from './charts/Columns';
import RankedBars from './charts/RankedBars';
import { addDays, formatMonthYear, formatShortDay, plural, todayISO, weekday } from '../lib/dates';
import { firstPlayDate, latestPlayDate, playsByDay, summarizePlays } from '../lib/plays';

type Range = 'year' | 'all';

const RANGES: { value: Range; label: string }[] = [
  { value: 'year', label: 'Past year' },
  { value: 'all', label: 'All time' },
];

const BoardGameStats = () => {
  const [range, setRange] = useState<Range>('year');
  // The statically built page ends at the latest logged play; the browser then moves on to today.
  const [today, setToday] = useState(latestPlayDate);
  useEffect(() => {
    const now = todayISO();
    if (now > latestPlayDate) setToday(now);
  }, []);

  // "Past year" is the 53 weeks the calendar shows, starting on a Monday.
  const yearStart = addDays(today, -weekday(today) - 52 * 7);
  const from = range === 'year' ? yearStart : firstPlayDate;
  const summary = useMemo(() => summarizePlays(from, today), [from, today]);

  if (!latestPlayDate) return null;

  const since = range === 'year' ? 'in the past year' : `since ${formatMonthYear(firstPlayDate)}`;
  const tiles = [
    { label: 'Plays', value: summary.totalPlays, note: since },
    { label: 'Different games', value: summary.totalGames, note: since },
    { label: 'Days played', value: summary.daysPlayed, note: since },
    ...(summary.busiestDay
      ? [{ label: 'Busiest day', value: summary.busiestDay.total, note: formatShortDay(summary.busiestDay.date) }]
      : []),
  ];

  const calendars =
    range === 'year'
      ? [{ key: 'year', heading: null, from: yearStart, to: today, period: 'the past year' }]
      : (() => {
          const years = [];
          for (let year = Number(today.slice(0, 4)); year >= Number(firstPlayDate.slice(0, 4)); year--) {
            const yearEnd = `${year}-12-31`;
            const to = yearEnd < today ? yearEnd : today;
            const plays = summarizePlays(`${year}-01-01`, to).totalPlays;
            years.push({
              key: String(year),
              heading: `${year} · ${plural(plays, 'play', 'plays')}`,
              from: `${year}-01-01`,
              to,
              period: String(year),
            });
          }
          return years;
        })();

  // The past year usually starts mid-month; leave that partial month out of the monthly chart.
  const months = range === 'year' && !yearStart.endsWith('-01') ? summary.byMonth.slice(1) : summary.byMonth;
  const { columns, periodName, grouping } = monthColumns(months, today.slice(0, 7));

  const topGames = summary.mostPlayed.slice(0, 10).map((game) => ({
    key: game.id,
    label: game.name,
    value: game.plays,
    href: game.href,
    tipValue: plural(game.plays, 'play', 'plays'),
    tipDetail: [game.name, `Last played ${formatShortDay(game.lastPlayed)}`],
  }));

  return (
    <section className="mt-12">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl">Play History</h2>
        <div role="group" aria-label="Time range" className="flex gap-1 text-sm">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-full px-3 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                range === option.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
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

      <div className="mt-8 space-y-4">
        {calendars.map((calendar) => (
          <div key={calendar.key}>
            {calendar.heading && <h3 className="mb-1 text-sm text-gray-500">{calendar.heading}</h3>}
            <CalendarHeatmap
              days={playsByDay}
              from={calendar.from}
              to={calendar.to}
              period={calendar.period}
              scrollToEnd={calendar.to === today}
              centered={range === 'year'}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-3 text-sm text-gray-500" aria-hidden="true">
        <span>Plays per day</span>
        {HEATMAP_LEVELS.map((level) => (
          <span key={level.label} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: level.color }} />
            {level.label}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-12 mt-8">
        <div>
          <h3 className="text-lg mb-3">{grouping === 'year' ? 'Plays per year' : 'Plays per month'}</h3>
          <Columns
            data={columns}
            unit={['play', 'plays']}
            periodName={periodName}
            caption={`Board game plays per ${grouping} ${since}`}
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
