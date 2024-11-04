import React, { useEffect, useRef, useState } from 'react';

const GoodreadsWidget = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://www.goodreads.com/review/grid_widget/61547440.Last%20Read?cover_size=medium&hide_link=&hide_title=&num_books=12&order=d&sort=date_read&shelf=read&widget_id=1725799722";
    script.async = true;
    script.type = "text/javascript";
    script.charset = "utf-8";
    
    script.onload = () => {
      setIsLoading(false);
    };

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
    <>
      {isLoading && (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
          {[...Array(12)].map((_, index) => (
            <div 
              key={index}
              className={`aspect-[2/3] rounded bg-gray-200 animate-pulse`}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      )}
      <div id="gr_grid_widget_1725799722" ref={widgetRef} className={isLoading ? 'hidden' : ''}>
        {/* The Goodreads widget will be inserted here */}
      </div>
    </>
  );
};

export default GoodreadsWidget;
