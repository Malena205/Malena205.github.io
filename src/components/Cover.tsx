import React from 'react';

interface Props {
  href: string;
  imgSrc: string;
  title: string;
  /** Lines revealed over the cover on hover and keyboard focus. */
  details: string[];
  /** Forces a fixed shape; otherwise the image keeps its own proportions. */
  aspectClassName?: string;
}

const Cover = ({ href, imgSrc, title, details, aspectClassName }: Props) => (
  <a
    href={href}
    rel="noopener"
    aria-label={[title, ...details].join(', ')}
    className="group relative flex flex-col justify-end transition hover:scale-105 focus-visible:scale-105"
  >
    <img
      src={imgSrc}
      alt=""
      className={`w-full rounded object-cover shadow-md shadow-gray-400 ${aspectClassName ?? ''}`}
    />
    <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b bg-gray-900/85 px-1.5 py-1 text-[11px] leading-tight text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
      <span className="line-clamp-2 block text-xs text-white">{title}</span>
      {details.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </span>
  </a>
);

export default Cover;
