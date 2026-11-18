import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, formatLongDay, formatMonth, parseDay, plural, weekday } from '../../lib/dates';
import { TipValue, Tooltip, useTooltip } from './Tooltip';

export interface HeatmapDay {
  total: number;
  games: { name: string; plays: number }[];
}

interface Props {
  days: Map<string, HeatmapDay>;
  /** First and last day shown, inclusive. */
  from: string;
  to: string;
  /** Describes the period for screen readers, e.g. "the past year" or "2025". */
  period: string;
  /** On narrow screens, start scrolled to the most recent weeks. */
  scrollToEnd?: boolean;
  /** Centre the calendar; leave off when several are stacked so they line up. */
  centered?: boolean;
}

const CELL = 12;
const STEP = 15;
const LEFT = 30;
const TOP = 18;
const HEIGHT = TOP + 7 * STEP;

// One hue, light to dark; the colours are defined in globals.css.
const EMPTY = '#efefec';
export const HEATMAP_LEVELS = [
  { min: 1, label: '1', color: 'var(--chart-1)' },
  { min: 2, label: '2–3', color: 'var(--chart-2)' },
  { min: 4, label: '4–6', color: 'var(--chart-3)' },
  { min: 7, label: '7+', color: 'var(--chart-4)' },
];

const colorFor = (total: number) => {
  let color = EMPTY;
  for (const level of HEATMAP_LEVELS) if (total >= level.min) color = level.color;
  return color;
};

const daysBetween = (from: string, to: string) =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86400000);

interface Hovered {
  date: string;
  column: number;
  row: number;
}

const CalendarHeatmap = ({ days, from, to, period, scrollToEnd, centered }: Props) => {
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { containerRef, tip, showAt, hide } = useTooltip<string>();

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scrollToEnd ? scroller.scrollWidth : 0;
  }, [scrollToEnd, from, to]);

  const { gridStart, weeks, monthLabels, total, activeDays } = useMemo(() => {
    // Columns are weeks starting on Monday.
    const firstMonday = addDays(from, -weekday(from));
    const weekCount = Math.floor(daysBetween(firstMonday, to) / 7) + 1;
    const labels: { column: number; text: string }[] = [];
    let previousMonth = '';
    for (let column = 0; column < weekCount; column++) {
      const weekStart = addDays(firstMonday, column * 7);
      const month = (weekStart < from ? from : weekStart).slice(0, 7);
      if (month !== previousMonth) {
        // Drop a label that would collide with the next one.
        if (labels.length && column - labels[labels.length - 1].column < 3) labels.pop();
        labels.push({ column, text: formatMonth(month) });
        previousMonth = month;
      }
    }
    let sum = 0;
    let active = 0;
    for (let date = from; date <= to; date = addDays(date, 1)) {
      const day = days.get(date);
      if (day) {
        sum += day.total;
        active += 1;
      }
    }
    return { gridStart: firstMonday, weeks: weekCount, monthLabels: labels, total: sum, activeDays: active };
  }, [days, from, to]);

  const width = LEFT + weeks * STEP;

  const cells = [];
  for (let column = 0; column < weeks; column++) {
    for (let row = 0; row < 7; row++) {
      const date = addDays(gridStart, column * 7 + row);
      if (date < from || date > to) continue;
      cells.push(
        <rect
          key={date}
          x={LEFT + column * STEP}
          y={TOP + row * STEP}
          width={CELL}
          height={CELL}
          rx={2.5}
          style={{ fill: colorFor(days.get(date)?.total ?? 0) }}
        />,
      );
    }
  }

  const handleLeave = () => {
    setHovered(null);
    hide();
  };

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const column = Math.floor((event.clientX - rect.left - LEFT + (STEP - CELL) / 2) / STEP);
    const row = Math.floor((event.clientY - rect.top - TOP + (STEP - CELL) / 2) / STEP);
    const date = addDays(gridStart, column * 7 + row);
    if (column < 0 || column >= weeks || row < 0 || row > 6 || date < from || date > to) {
      handleLeave();
      return;
    }
    setHovered({ date, column, row });
    showAt(rect.left + LEFT + column * STEP + CELL / 2, rect.top + TOP + row * STEP, date);
  };

  return (
    <div ref={containerRef} className="relative">
      <div ref={scrollerRef} className="overflow-x-auto pb-1">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Calendar of board game plays in ${period}: ${plural(total, 'play', 'plays')} on ${plural(activeDays, 'day', 'days')}.`}
          className={`block touch-pan-x ${centered ? 'mx-auto' : ''}`}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={handleLeave}
        >
          {monthLabels.map((label) => (
            <text key={label.column} x={LEFT + label.column * STEP} y={11} className="fill-gray-500 text-[11px]">
              {label.text}
            </text>
          ))}
          {['Mon', 'Wed', 'Fri'].map((label, index) => (
            <text key={label} x={0} y={TOP + index * 2 * STEP + 10} className="fill-gray-500 text-[11px]">
              {label}
            </text>
          ))}
          {cells}
          {hovered && (
            <rect
              x={LEFT + hovered.column * STEP - 1}
              y={TOP + hovered.row * STEP - 1}
              width={CELL + 2}
              height={CELL + 2}
              rx={3.5}
              fill="none"
              stroke="#111827"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          )}
        </svg>
      </div>
      <Tooltip tip={tip}>
        {(date) => {
          const day = days.get(date);
          return (
            <>
              <TipValue>{day ? plural(day.total, 'play', 'plays') : 'No plays'}</TipValue>
              <div>{formatLongDay(date)}</div>
              {day && (
                <ul className="mt-1 border-t border-gray-700 pt-1">
                  {day.games.map((game) => (
                    <li key={game.name}>
                      {game.name}
                      {game.plays > 1 ? ` ×${game.plays}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </>
          );
        }}
      </Tooltip>
    </div>
  );
};

export default CalendarHeatmap;
