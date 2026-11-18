import React, { useState } from 'react';
import { plural } from '../../lib/dates';
import { TipValue, Tooltip, useTooltip } from './Tooltip';

export interface Column {
  key: string;
  /** Full name of the period, e.g. "Dec 2025". */
  label: string;
  value: number;
  /** Text under the column on the axis; most columns leave this empty. */
  tick?: string;
}

interface Props {
  data: Column[];
  /** [singular, plural], e.g. ['play', 'plays'] */
  unit: [string, string];
  /** Heading of the periods in the accessible table, e.g. "Month". */
  periodName: string;
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

/** Columns over time: one hue, the peak labelled, every value in the tooltip and table. */
const Columns = ({ data, unit, periodName, caption }: Props) => {
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
                  key={entry.key}
                  type="button"
                  aria-label={`${entry.label}: ${plural(entry.value, unit[0], unit[1])}`}
                  className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center px-px focus:outline-none"
                  onPointerMove={(event) => activate(event, index)}
                  onPointerDown={(event) => activate(event, index)}
                  onFocus={(event) => activate(event, index)}
                  onBlur={deactivate}
                >
                  {index === peak && active === null && max > 0 && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 text-[11px] tabular-nums text-gray-600"
                      style={{ bottom: PLOT_HEIGHT * (entry.value / top) + 2 }}
                    >
                      {entry.value}
                    </span>
                  )}
                  <span
                    className={`block w-full max-w-[24px] rounded-t transition-colors group-focus-visible:ring-2 group-focus-visible:ring-gray-900 ${
                      active === index ? 'bg-[var(--chart-bar-hover)]' : 'bg-[var(--chart-bar)]'
                    }`}
                    style={{ height: entry.value === 0 ? 0 : Math.max(2, PLOT_HEIGHT * (entry.value / top)) }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex text-[11px] text-gray-500" aria-hidden="true">
            {data.map((entry) => (
              <div key={entry.key} className="relative h-4 min-w-0 flex-1">
                {entry.tick && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{entry.tick}</span>
                )}
              </div>
            ))}
          </div>
          <Tooltip tip={tip}>
            {(index) => (
              <>
                <TipValue>{plural(data[index].value, unit[0], unit[1])}</TipValue>
                <div>{data[index].label}</div>
              </>
            )}
          </Tooltip>
        </div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{periodName}</th>
            <th scope="col">{unit[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.key}>
              <th scope="row">{entry.label}</th>
              <td>{entry.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Turns per-month totals into columns. Short ranges label every month; longer
 * ones label each January with its year; very long ones are grouped by year.
 */
export function monthColumns(byMonth: { month: string; value: number }[], currentMonth?: string) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const name = (month: string) => `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
  const currentYear = currentMonth?.slice(0, 4);

  if (byMonth.length > 48) {
    const years = new Map<string, number>();
    for (const entry of byMonth) {
      const year = entry.month.slice(0, 4);
      years.set(year, (years.get(year) ?? 0) + entry.value);
    }
    const columns: Column[] = Array.from(years.entries()).map(([year, value]) => ({
      key: year,
      label: year === currentYear ? `${year} (so far)` : year,
      value,
      tick: years.size <= 12 ? year : `’${year.slice(2)}`,
    }));
    return { columns, periodName: 'Year', grouping: 'year' as const };
  }

  const everyMonth = byMonth.length <= 13;
  const columns: Column[] = byMonth.map((entry, index) => {
    const isJanuary = entry.month.endsWith('-01');
    const nearJanuary = byMonth.slice(index + 1, index + 4).some((other) => other.month.endsWith('-01'));
    let tick: string | undefined;
    if (everyMonth) tick = MONTHS[Number(entry.month.slice(5, 7)) - 1];
    else if (isJanuary || (index === 0 && !nearJanuary)) tick = entry.month.slice(0, 4);
    return {
      key: entry.month,
      label: entry.month === currentMonth ? `${name(entry.month)} (so far)` : name(entry.month),
      value: entry.value,
      tick,
    };
  });
  return { columns, periodName: 'Month', grouping: 'month' as const };
}

export default Columns;
