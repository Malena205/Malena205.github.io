import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, formatLongDay, formatMonth, plural, todayISO, weekday } from '../../lib/dates';
import { TipValue, Tooltip, useTooltip } from './Tooltip';

export interface HeatmapDay {
  total: number;
  games: { name: string; plays: number }[];
}

interface Props {
  days: Map<string, HeatmapDay>;
  /** Last day shown until the browser supplies today's date. */
  initialEnd: string;
}

const WEEKS = 53;
const CELL = 12;
const STEP = 15;
const LEFT = 30;
const TOP = 18;
const WIDTH = LEFT + WEEKS * STEP;
const HEIGHT = TOP + 7 * STEP;

// One blue hue, light to dark; validated as an ordinal ramp against white.
const EMPTY = '#efefec';
const LEVELS = [
  { min: 1, label: '1', color: '#86b6ef' },
  { min: 2, label: '2–3', color: '#3987e5' },
  { min: 4, label: '4–6', color: '#1c5cab' },
  { min: 7, label: '7+', color: '#0d366b' },
];

const colorFor = (total: number) => {
  let color = EMPTY;
  for (const level of LEVELS) if (total >= level.min) color = level.color;
  return color;
};

interface Hovered {
  date: string;
  column: number;
  row: number;
}

const CalendarHeatmap = ({ days, initialEnd }: Props) => {
  const [end, setEnd] = useState(initialEnd);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { containerRef, tip, showAt, hide } = useTooltip<string>();

  useEffect(() => {
    const today = todayISO();
    if (today > initialEnd) setEnd(today);
  }, [initialEnd]);

  // On narrow screens the chart scrolls sideways; start at the most recent weeks.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [end]);

  const { start, monthLabels, total, activeDays } = useMemo(() => {
    const firstDay = addDays(end, -weekday(end) - (WEEKS - 1) * 7);
    const labels: { column: number; text: string }[] = [];
    let previousMonth = '';
    for (let column = 0; column < WEEKS; column++) {
      const month = addDays(firstDay, column * 7).slice(0, 7);
      if (month !== previousMonth) {
        // Drop a label that would collide with the next one.
        if (labels.length && column - labels[labels.length - 1].column < 3) labels.pop();
        labels.push({ column, text: formatMonth(month) });
        previousMonth = month;
      }
    }
    let sum = 0;
    let active = 0;
    for (let offset = 0; addDays(firstDay, offset) <= end; offset++) {
      const day = days.get(addDays(firstDay, offset));
      if (day) {
        sum += day.total;
        active += 1;
      }
    }
    return { start: firstDay, monthLabels: labels, total: sum, activeDays: active };
  }, [days, end]);

  const cells = [];
  for (let column = 0; column < WEEKS; column++) {
    for (let row = 0; row < 7; row++) {
      const date = addDays(start, column * 7 + row);
      if (date > end) continue;
      cells.push(
        <rect
          key={date}
          x={LEFT + column * STEP}
          y={TOP + row * STEP}
          width={CELL}
          height={CELL}
          rx={2.5}
          fill={colorFor(days.get(date)?.total ?? 0)}
        />,
      );
    }
  }

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const column = Math.floor((event.clientX - rect.left - LEFT + (STEP - CELL) / 2) / STEP);
    const row = Math.floor((event.clientY - rect.top - TOP + (STEP - CELL) / 2) / STEP);
    const date = addDays(start, column * 7 + row);
    if (column < 0 || column >= WEEKS || row < 0 || row > 6 || date > end) {
      setHovered(null);
      hide();
      return;
    }
    setHovered({ date, column, row });
    showAt(rect.left + LEFT + column * STEP + CELL / 2, rect.top + TOP + row * STEP, date);
  };

  const handleLeave = () => {
    setHovered(null);
    hide();
  };

  return (
    <div>
      <div ref={containerRef} className="relative">
        <div ref={scrollerRef} className="overflow-x-auto pb-1">
          <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Calendar of board game plays over the past year: ${plural(total, 'play', 'plays')} on ${plural(activeDays, 'day', 'days')}.`}
            className="mx-auto block touch-pan-x"
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-500">
        <span>
          {plural(total, 'play', 'plays')} on {plural(activeDays, 'day', 'days')} in the past year
        </span>
        <span className="flex items-center gap-3" aria-hidden="true">
          <span>Plays per day</span>
          {LEVELS.map((level) => (
            <span key={level.label} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: level.color }} />
              {level.label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
