import React, { useState } from 'react';
import { formatMonthYear, plural } from '../../lib/dates';
import { TipValue, Tooltip, useTooltip } from './Tooltip';

interface Props {
  data: { month: string; value: number }[];
  /** [singular, plural], e.g. ['play', 'plays'] */
  unit: [string, string];
  /** 'YYYY-MM' of a month that is still in progress, if any. */
  currentMonth?: string;
  caption: string;
}

const PLOT_HEIGHT = 160;

function niceScale(max: number) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = steps.find((candidate) => max / candidate <= 4) ?? steps[steps.length - 1];
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = [];
  for (let tick = 0; tick <= top; tick += step) ticks.push(tick);
  return { top, ticks };
}

const MonthlyColumns = ({ data, unit, currentMonth, caption }: Props) => {
  const { containerRef, tip, show, hide } = useTooltip<number>();
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) return null;
  const max = Math.max(...data.map((entry) => entry.value));
  const { top, ticks } = niceScale(max);
  const peak = data.findIndex((entry) => entry.value === max);

  const activate = (event: React.PointerEvent | React.FocusEvent, index: number) => {
    setActive(index);
    show(event, index);
  };
  const deactivate = () => {
    setActive(null);
    hide();
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative w-6 shrink-0 text-right text-[11px] tabular-nums text-gray-500" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: PLOT_HEIGHT * (1 - tick / top) }}>
              {tick}
            </span>
          ))}
        </div>
        <div ref={containerRef} className="relative min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_HEIGHT }} onPointerLeave={deactivate}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className={`absolute inset-x-0 border-t ${tick === 0 ? 'border-gray-300' : 'border-gray-100'}`}
                style={{ top: PLOT_HEIGHT * (1 - tick / top) }}
              />
            ))}
            <div className="absolute inset-0 flex items-end">
              {data.map((entry, index) => (
                <button
                  key={entry.month}
                  type="button"
                  aria-label={`${formatMonthYear(entry.month)}: ${plural(entry.value, unit[0], unit[1])}`}
                  className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center px-px focus:outline-none"
                  onPointerMove={(event) => activate(event, index)}
                  onPointerDown={(event) => activate(event, index)}
                  onFocus={(event) => activate(event, index)}
                  onBlur={deactivate}
                >
                  {index === peak && active === null && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 text-[11px] tabular-nums text-gray-600"
                      style={{ bottom: PLOT_HEIGHT * (entry.value / top) + 2 }}
                    >
                      {entry.value}
                    </span>
                  )}
                  <span
                    className={`block w-full max-w-[24px] rounded-t transition-colors group-focus-visible:ring-2 group-focus-visible:ring-gray-900 ${
                      active === index ? 'bg-[#1c5cab]' : 'bg-[#2a78d6]'
                    }`}
                    style={{ height: entry.value === 0 ? 0 : Math.max(2, PLOT_HEIGHT * (entry.value / top)) }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex text-[11px] text-gray-500">
            {data.map((entry, index) => {
              const isJanuary = entry.month.endsWith('-01');
              const showYear = isJanuary || (index === 0 && !data.slice(1, 3).some((other) => other.month.endsWith('-01')));
              return (
                <div key={entry.month} className="relative h-4 min-w-0 flex-1">
                  {showYear && <span className="absolute left-0 whitespace-nowrap">{entry.month.slice(0, 4)}</span>}
                </div>
              );
            })}
          </div>
          <Tooltip tip={tip}>
            {(index) => (
              <>
                <TipValue>{plural(data[index].value, unit[0], unit[1])}</TipValue>
                <div>
                  {formatMonthYear(data[index].month)}
                  {data[index].month === currentMonth ? ' (so far)' : ''}
                </div>
              </>
            )}
          </Tooltip>
        </div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">{unit[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.month}>
              <th scope="row">{formatMonthYear(entry.month)}</th>
              <td>{entry.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyColumns;
