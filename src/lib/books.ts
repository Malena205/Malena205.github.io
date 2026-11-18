import booksData from '../../public/books.json';
import { monthRange } from './dates';

export interface Book {
  /** Goodreads review id */
  id: string;
  title: string;
  fullTitle: string;
  author: string | null;
  rating: number | null;
  cover: string;
  /** Day the book first appeared on the read shelf; null for books already there when tracking began. */
  firstSeen: string | null;
}

/** Newest first, as ordered by date read on Goodreads. */
export const books = booksData as Book[];

export const bookHref = (book: Book) => `https://www.goodreads.com/review/show/${book.id}`;

const ratedBooks = books.filter((book) => book.rating !== null);
export const ratedCount = ratedBooks.length;

export const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
  stars,
  count: ratedBooks.filter((book) => book.rating === stars).length,
}));

export const averageRating = ratedCount
  ? ratedBooks.reduce((sum, book) => sum + (book.rating ?? 0), 0) / ratedCount
  : null;

const booksWithAuthor = books.filter((book) => book.author);
export const authorSampleSize = booksWithAuthor.length;

export const topAuthors = (() => {
  const counts = new Map<string, { name: string; count: number; titles: string[] }>();
  for (const book of booksWithAuthor) {
    const name = book.author as string;
    const entry = counts.get(name) ?? { name, count: 0, titles: [] };
    entry.count += 1;
    entry.titles.push(book.title);
    counts.set(name, entry);
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

export const booksByMonth = (() => {
  const dated = books.filter((book) => book.firstSeen).map((book) => (book.firstSeen as string).slice(0, 7));
  if (dated.length === 0) return [];
  const sorted = [...dated].sort();
  return monthRange(sorted[0], sorted[sorted.length - 1]).map((month) => ({
    month,
    value: dated.filter((value) => value === month).length,
  }));
})();
