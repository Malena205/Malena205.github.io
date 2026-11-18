import React from 'react';
import Cover from './Cover';
import { bookHref, books } from '../lib/books';

const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

const BooksWidget = () => (
  <>
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
      {books.slice(0, 12).map((book) => {
        const details = [];
        if (book.author) details.push(book.author);
        if (book.rating) details.push(stars(book.rating));
        return (
          <Cover
            key={book.id}
            href={bookHref(book)}
            imgSrc={book.cover}
            title={book.title}
            details={details}
            aspectClassName="aspect-[2/3]"
          />
        );
      })}
    </div>
    <div className="flex items-center justify-center mt-4">
      <a
        href="https://www.goodreads.com/review/list/61547440?shelf=read"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:underline"
      >
        My shelf on Goodreads
      </a>
    </div>
  </>
);

export default BooksWidget;
