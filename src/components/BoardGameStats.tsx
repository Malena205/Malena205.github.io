import React, { useEffect, useMemo, useRef, useState } from 'react';
import CalendarHeatmap, { HEATMAP_LEFT, HEATMAP_LEVELS } from './charts/CalendarHeatmap';
import Columns, { monthColumns } from './charts/Columns';
import RankedBars from './charts/RankedBars';
import { addDays, formatMonthYear, formatShortDay, plural, todayISO, weekday } from '../lib/dates';
import { firstPlayDate, latestPlayDate, playsByDay, summarizePlays } from '../lib/plays';

type Range = 'year' | 'all';

const RANGES: { value: Range; label: string }[] = [
  { value: 'year', label: 'Past year' },
  { value: 'all', label: 'All time' },
];

const YEAR_WEEKS = 53;

const BoardGameStats = () => {
  const [range, setRange] = useState<Range>('year');
  // The statically built page ends at the latest logged play; the browser then moves on to today.
  const [today, setToday] = useState(latestPlayDate);
  useEffect(() => {
    const now = todayISO();
    if (now > latestPlayDate) setToday(now);
  }, []);

  // "Past year" is the 53 weeks the calendar shows, starting on a Monday.
  const yearStart = addDays(today, -weekday(today) - (YEAR_WEEKS - 1) * 7);
  const pastYear = useMemo(() => summarizePlays(yearStart, today), [yearStart, today]);

  // The calendar shows a full year where there is room, and otherwise as many
  // recent weeks as fit the width, with slightly larger squares for touch.
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendar, setCalendar] = useState({ weeks: YEAR_WEEKS, step: 15 });
  useEffect(() => {
    const element = calendarRef.current;
    if (!element) return;
    const fit = () => {
      const width = element.clientWidth;
      const fitsYear = width >= HEATMAP_LEFT + YEAR_WEEKS * 15;
      const step = fitsYear ? 15 : 16;
      const weeks = fitsYear ? YEAR_WEEKS : Math.max(8, Math.floor((width - HEATMAP_LEFT) / step));
      setCalendar((current) => (current.weeks === weeks && current.step === step ? current : { weeks, step }));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const calendarStart = addDays(today, -weekday(today) - (calendar.weeks - 1) * 7);
  const calendarPeriod = calendar.weeks === YEAR_WEEKS ? 'the past year' : `the past ${calendar.weeks} weeks`;
  const shown = useMemo(() => summarizePlays(calendarStart, today), [calendarStart, today]);
  const allTime = useMemo(() => summarizePlays(firstPlayDate, today), [today]);

  if (!latestPlayDate) return null;

  // The calendar always shows the past year; the switch scopes everything below it.
  const summary = range === 'year' ? pastYear : allTime;
  const since = range === 'year' ? 'in the past year' : `since ${formatMonthYear(firstPlayDate)}`;
  const tiles = [
    { label: 'Plays', value: summary.totalPlays, note: since },
    { label: 'Different games', value: summary.totalGames, note: since },
    {
      label: 'H-index',
      value: summary.hIndex,
      note: `${plural(summary.hIndex, 'game', 'games')} played ${summary.hIndex}+ times`,
    },
    ...(summary.busiestDay
      ? [{ label: 'Busiest day', value: summary.busiestDay.total, note: formatShortDay(summary.busiestDay.date) }]
      : []),
  ];

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
      <h2 className="text-2xl mb-2">Play History</h2>
      <hr className="mb-4" />

      <div ref={calendarRef}>
        <CalendarHeatmap
          days={playsByDay}
          from={calendarStart}
          to={today}
          period={calendarPeriod}
          step={calendar.step}
          scrollToEnd
          centered
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-500">
        <span>
          {plural(shown.totalPlays, 'play', 'plays')} on {plural(shown.daysPlayed, 'day', 'days')} in {calendarPeriod}
        </span>
        <span className="flex items-center gap-3" aria-hidden="true">
          <span>Plays per day</span>
          {HEATMAP_LEVELS.map((level) => (
            <span key={level.label} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: level.color }} />
              {level.label}
            </span>
          ))}
        </span>
      </div>

      <div role="group" aria-label="Time range for the statistics below" className="mt-10 mb-4 flex gap-1 text-sm">
        {RANGES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={range === option.value}
            onClick={() => setRange(option.value)}
            className={`rounded-full px-3 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
              range === option.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <dt className="text-sm text-gray-500">{tile.label}</dt>
            <dd className="text-3xl">{tile.value.toLocaleString('en-GB')}</dd>
            <dd className="text-xs text-gray-500">{tile.note}</dd>
          </div>
        ))}
      </dl>

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
          <RankedBars rows={topGames} shaded />
        </div>
      </div>
    </section>
  );
};

export default BoardGameStats;
