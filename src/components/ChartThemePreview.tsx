import React, { useEffect, useState } from 'react';

// Local-preview helper for choosing a chart colour theme. It renders nothing in
// the built site; the theme the site uses is the :root block in globals.css.
const THEMES = ['blue', 'ink', 'slate', 'petrol', 'indigo', 'forest', 'plum', 'terracotta', 'ochre'];

const ChartThemePreview = () => {
  const [theme, setTheme] = useState('blue');

  useEffect(() => {
    document.documentElement.dataset.chartTheme = theme;
  }, [theme]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-20 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
      <div className="mb-2 text-gray-500">Chart colours (preview only)</div>
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((name) => (
          <button
            key={name}
            type="button"
            data-chart-theme={name}
            aria-pressed={theme === name}
            onClick={() => setTheme(name)}
            className={`flex flex-col items-center gap-1 rounded px-1.5 py-1 ${theme === name ? 'bg-gray-100 ring-1 ring-gray-900' : 'hover:bg-gray-50'}`}
          >
            <span className="block h-5 w-5 rounded-full" style={{ backgroundColor: 'var(--chart-bar)' }} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartThemePreview;
