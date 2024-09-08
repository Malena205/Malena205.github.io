import React, { useEffect, useRef } from 'react';

const GoodreadsWidget = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://www.goodreads.com/review/grid_widget/61547440.Last%20Read?cover_size=medium&hide_link=&hide_title=&num_books=12&order=d&sort=date_read&shelf=read&widget_id=1725799722";
    script.async = true;
    script.type = "text/javascript";
    script.charset = "utf-8";

    scriptRef.current = script;

    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
    }

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, []);

  return (
    <div id="gr_grid_widget_1725799722" ref={widgetRef}>
      {/* The Goodreads widget will be inserted here */}
    </div>
  );
};

export default GoodreadsWidget;