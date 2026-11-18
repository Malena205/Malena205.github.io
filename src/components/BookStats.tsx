import React from 'react';
import Columns, { monthColumns } from './charts/Columns';
import RankedBars from './charts/RankedBars';
import { plural } from '../lib/dates';
import { authorSampleSize, averageRating, booksByMonth, ratedCount, ratingDistribution, topAuthors } from '../lib/books';

const BookStats = () => {
  if (ratedCount === 0 && authorSampleSize === 0) return null;

  const ratings = ratingDistribution.map(({ stars, count }) => ({
    key: String(stars),
    label: (
      <span aria-label={plural(stars, 'star', 'stars')}>
        <span aria-hidden="true">
          {'★'.repeat(stars)}
          <span className="text-gray-300">{'★'.repeat(5 - stars)}</span>
        </span>
      </span>
    ),
    value: count,
    tipValue: plural(count, 'book', 'books'),
    tipDetail: [`${plural(stars, 'star', 'stars')} · ${Math.round((100 * count) / ratedCount)}% of rated books`],
  }));

  const authors = topAuthors.slice(0, 8).map((author) => ({
    key: author.name,
    label: author.name,
    value: author.count,
    tipValue: plural(author.count, 'book', 'books'),
    tipDetail: [author.titles.slice(0, 4).join(', ') + (author.titles.length > 4 ? ', …' : '')],
  }));

  return (
    <section className="mt-12">
      <h2 className="text-2xl mb-2">Reading</h2>
      <hr className="mb-4" />

      <div className="grid sm:grid-cols-2 gap-12">
        <div>
          <h3 className="text-lg">My ratings</h3>
          <p className="mb-3 text-sm text-gray-500">
            Last {ratedCount} rated books
            {averageRating !== null ? `, ${averageRating.toFixed(1)} stars on average` : ''}
          </p>
          <RankedBars rows={ratings} labelWidth="5.5rem" />
        </div>
        <div>
          <h3 className="text-lg">Most-read authors</h3>
          <p className="mb-3 text-sm text-gray-500">Among my last {authorSampleSize} books</p>
          <RankedBars rows={authors} shaded />
        </div>
      </div>

      {booksByMonth.length > 0 && (
        <div className="mt-8 sm:w-1/2 sm:pr-6">
          <h3 className="text-lg mb-3">Books finished per month</h3>
          <Columns
            data={monthColumns(booksByMonth).columns}
            unit={['book', 'books']}
            periodName="Month"
            caption="Books finished per month"
          />
        </div>
      )}
    </section>
  );
};

export default BookStats;
