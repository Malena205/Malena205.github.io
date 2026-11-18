import React from 'react';
import { TipValue, Tooltip, useTooltip } from './Tooltip';

export interface RankedBar {
  key: string;
  label: React.ReactNode;
  value: number;
  href?: string;
  /** Headline of the tooltip, e.g. "60 plays". */
  tipValue: string;
  /** Extra tooltip lines. */
  tipDetail?: string[];
}

/** Ranked horizontal bars: one hue, value printed at the tip of each bar. */
const RankedBars = ({ rows, labelWidth = '9.5rem' }: { rows: RankedBar[]; labelWidth?: string }) => {
  const { containerRef, tip, show, hide } = useTooltip<RankedBar>();
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div ref={containerRef} className="relative">
      <ul className="space-y-1.5" onPointerLeave={hide}>
        {rows.map((row) => (
          <li
            key={row.key}
            className="group grid items-center gap-3 text-sm"
            style={{ gridTemplateColumns: `minmax(0, ${labelWidth}) minmax(0, 1fr)` }}
            onPointerMove={(event) => show(event, row)}
            onPointerDown={(event) => show(event, row)}
          >
            {row.href ? (
              <a
                href={row.href}
                rel="noopener"
                className="truncate text-gray-700 hover:underline"
                onFocus={(event) => show(event, row)}
                onBlur={hide}
              >
                {row.label}
              </a>
            ) : (
              <span className="truncate text-gray-700">{row.label}</span>
            )}
            <span className="flex items-center">
              <span
                className="block h-3 rounded-r bg-[#2a78d6] transition-colors group-hover:bg-[#1c5cab]"
                style={{ width: `calc((100% - 2.25rem) * ${row.value / max})`, minWidth: row.value > 0 ? 2 : 0 }}
              />
              <span className="ml-2 tabular-nums text-gray-600">{row.value}</span>
            </span>
          </li>
        ))}
      </ul>
      <Tooltip tip={tip}>
        {(row) => (
          <>
            <TipValue>{row.tipValue}</TipValue>
            {row.tipDetail?.map((line) => <div key={line}>{line}</div>)}
          </>
        )}
      </Tooltip>
    </div>
  );
};

export default RankedBars;
