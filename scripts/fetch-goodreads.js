const fs = require('fs');
const path = require('path');

// Goodreads has no API and its shelf pages need a login, but the embeddable
// widgets are public. The grid widget lists the latest 200 read books; the
// custom widget adds author and rating for the latest 100. Neither exposes the
// date read, so each book is stamped with the day it first shows up here.
const USER = '61547440.Last%20Read';
const SHELF = 'order=d&shelf=read&sort=date_read';
const GRID_URL = `https://www.goodreads.com/review/grid_widget/${USER}?cover_size=medium&num_books=200&${SHELF}&widget_id=1`;
const CUSTOM_URL = `https://www.goodreads.com/review/custom_widget/${USER}?cover_size=medium&num_books=100&${SHELF}&show_author=1&show_cover=1&show_rating=1&show_review=0&show_tags=0&show_title=1&widget_id=2`;
const OUTPUT = path.join(__dirname, '../public/books.json');
// A newly listed book only counts as "just read" if it lands near the top of
// the date-read ordering; older books added to the shelf later sort further down.
const RECENT_POSITIONS = 20;

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// The widget endpoint returns JavaScript: `var widget_code = '<html…>'`.
function extractWidgetHtml(js) {
  const match = js.match(/var widget_code = '((?:[^'\\]|\\.)*)'/);
  if (!match) throw new Error('widget_code not found in Goodreads response');
  return match[1].replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
}

function largerCover(src) {
  return src.replace(/\._S[XY]\d+_\./, '._SX200_.');
}

function parseGrid(html) {
  const books = [];
  const regex = /<div class="gr_grid_book_container"><a title="([^"]*)"[^>]*href="[^"]*\/review\/show\/(\d+)[^"]*"><img alt="([^"]*)"[^>]*src="([^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    books.push({
      id: match[2],
      title: decodeEntities(match[3]) || decodeEntities(match[1]),
      fullTitle: decodeEntities(match[1]),
      cover: largerCover(match[4]),
    });
  }
  return books;
}

function parseCustom(html) {
  const details = {};
  const blocks = html.split('gr_custom_each_container').slice(1);
  for (const block of blocks) {
    const id = (block.match(/\/review\/show\/(\d+)/) || [])[1];
    if (!id) continue;
    const author = (block.match(/gr_custom_author[^>]*>\s*by\s*<a[^>]*>([^<]*)<\/a>/) || [])[1];
    const rating = (block.match(/star_active\.png/g) || []).length;
    details[id] = {
      author: author ? decodeEntities(author).replace(/\s+/g, ' ').trim() : null,
      rating: rating > 0 ? rating : null,
    };
  }
  return details;
}

function mergeBooks(existing, grid, details, today) {
  const known = new Map(existing.map((book) => [book.id, book]));
  const isFirstRun = existing.length === 0;
  const merged = grid.map((book, index) => {
    const previous = known.get(book.id) || {};
    const detail = details[book.id] || {};
    let firstSeen = previous.firstSeen || null;
    if (!known.has(book.id) && !isFirstRun && index < RECENT_POSITIONS) firstSeen = today;
    return {
      id: book.id,
      title: book.title,
      fullTitle: book.fullTitle,
      author: detail.author || previous.author || null,
      rating: detail.rating || previous.rating || null,
      cover: book.cover,
      firstSeen,
    };
  });
  // Keep books that have dropped out of the 200-book window.
  const listed = new Set(grid.map((book) => book.id));
  return merged.concat(existing.filter((book) => !listed.has(book.id)));
}

async function fetchWidget(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0' },
  });
  if (!response.ok) throw new Error(`Goodreads responded ${response.status} for ${url}`);
  return extractWidgetHtml(await response.text());
}

async function fetchGoodreads() {
  const grid = parseGrid(await fetchWidget(GRID_URL));
  if (grid.length === 0) throw new Error('No books parsed from the Goodreads grid widget');

  let details = {};
  try {
    details = parseCustom(await fetchWidget(CUSTOM_URL));
  } catch (err) {
    console.warn('Could not fetch authors and ratings, keeping existing ones:', err.message);
  }

  const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) : [];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  const books = mergeBooks(existing, grid, details, today);

  fs.writeFileSync(OUTPUT, JSON.stringify(books, null, 1) + '\n');
  const added = books.length - existing.length;
  console.log(`Wrote ${books.length} books (${added} new, ${Object.keys(details).length} with details)`);
}

module.exports = { extractWidgetHtml, parseGrid, parseCustom, mergeBooks };

if (require.main === module) {
  fetchGoodreads().catch((err) => {
    console.error('Error fetching Goodreads data:', err);
    process.exit(1);
  });
}
