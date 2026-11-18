import React, { useCallback, useRef, useState } from 'react';

interface TipState<T> {
  x: number;
  y: number;
  width: number;
  data: T;
}

/**
 * One tooltip per chart. Attach `containerRef` to a `relative` wrapper, call
 * `show` from pointer or focus handlers and render <Tooltip tip={tip}>.
 */
export function useTooltip<T>() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState<T> | null>(null);

  const showAt = useCallback((clientX: number, clientY: number, data: T) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTip({ x: clientX - rect.left, y: clientY - rect.top, width: rect.width, data });
  }, []);

  const show = useCallback(
    (event: React.PointerEvent | React.FocusEvent, data: T) => {
      if ('clientX' in event) {
        showAt(event.clientX, event.clientY, data);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        showAt(rect.left + rect.width / 2, rect.top, data);
      }
    },
    [showAt],
  );

  const hide = useCallback(() => setTip(null), []);

  return { containerRef, tip, show, showAt, hide };
}

const HALF_WIDTH = 96;

export function Tooltip<T>({ tip, children }: { tip: TipState<T> | null; children: (data: T) => React.ReactNode }) {
  if (!tip) return null;
  const left = Math.min(Math.max(tip.x, HALF_WIDTH), Math.max(tip.width - HALF_WIDTH, HALF_WIDTH));
  const below = tip.y < 90;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-max max-w-[12rem] rounded-md bg-gray-900 px-2.5 py-1.5 text-xs leading-snug text-gray-300 shadow-lg"
      style={{
        left,
        top: tip.y,
        transform: below ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 10px))',
      }}
    >
      {children(tip.data)}
    </div>
  );
}

export const TipValue = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-white">{children}</div>
);
