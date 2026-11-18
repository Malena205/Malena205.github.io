const fs = require('fs');
const path = require('path');

const USERNAME = 'lena205';
const API = 'https://boardgamegeek.com/xmlapi2';
const PUBLIC_DIR = path.join(__dirname, '../public');
const RECENT_GAMES = 12;
const PLAYS_PER_PAGE = 100;
const MAX_PAGES = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? decodeEntities(match[1]) : null;
}

// Parses one page of /xmlapi2/plays. Only the date, quantity and game are kept:
// players, locations and comments are deliberately not published.
function parsePlaysXml(xml) {
  const rootTag = (xml.match(/<plays\b[^>]*>/) || [''])[0];
  const total = Number(attr(rootTag, 'total')) || 0;
  const plays = [];
  const playRegex = /<play\b[^>]*>[\s\S]*?<\/play>/g;
  let playMatch;
  while ((playMatch = playRegex.exec(xml)) !== null) {
    const playXml = playMatch[0];
    const playTag = playXml.match(/<play\b[^>]*>/)[0];
    const itemTag = (playXml.match(/<item\b[^>]*>/) || [''])[0];
    const id = attr(itemTag, 'objectid');
    if (!id) continue;
    plays.push({
      date: attr(playTag, 'date'),
      quantity: Math.max(1, Number(attr(playTag, 'quantity')) || 1),
      id,
      name: attr(itemTag, 'name') || 'Unknown name',
    });
  }
  return { total, plays };
}

function parseThingsXml(xml) {
  const games = [];
  const itemRegex = /<item\b[^>]*\sid="(\d+)"[^>]*>[\s\S]*?<\/item>/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[0];
    const nameTag = (itemXml.match(/<name\b[^>]*type="primary"[^>]*>/) || [''])[0];
    const imageMatch = itemXml.match(/<image>([^<]+)<\/image>/);
    games.push({
      id: itemMatch[1],
      name: attr(nameTag, 'value') || 'Unknown name',
      imgSrc: imageMatch ? decodeEntities(imageMatch[1].trim()) : '/profile-pic.jpg',
    });
  }
  return games;
}

async function fetchXml(url, headers) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(url, { headers });
    if (response.status === 200) return response.text();
    // 202 means BGG has queued the request; 429/5xx are rate limiting or hiccups.
    if (response.status === 202 || response.status === 429 || response.status >= 500) {
      await sleep(attempt * 5000);
      continue;
    }
    throw new Error(`${url} responded ${response.status}`);
  }
  throw new Error(`${url} kept failing after retries`);
}

async function fetchAllPlays(headers) {
  const plays = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const xml = await fetchXml(`${API}/plays?username=${USERNAME}&page=${page}`, headers);
    const parsed = parsePlaysXml(xml);
    plays.push(...parsed.plays);
    if (parsed.plays.length < PLAYS_PER_PAGE || plays.length >= parsed.total) break;
    await sleep(2000);
  }
  return plays;
}

function buildPlaysData(plays) {
  const games = {};
  const rows = [];
  for (const play of plays) {
    games[play.id] = play.name;
    if (/^\d{4}-\d{2}-\d{2}$/.test(play.date) && play.date !== '0000-00-00') {
      rows.push([play.date, play.id, play.quantity]);
    }
  }
  return { games, plays: rows };
}

function writeJson(file, data, compact) {
  const outputPath = path.join(PUBLIC_DIR, file);
  fs.writeFileSync(outputPath, (compact ? JSON.stringify(data) : JSON.stringify(data, null, 2)) + '\n');
  return outputPath;
}

async function fetchBGGData() {
  const token = process.env.BGG_TOKEN;
  if (!token) {
    throw new Error('BGG_TOKEN environment variable is required');
  }
  const headers = { Authorization: `Bearer ${token}` };

  // BGG returns plays newest first.
  const plays = await fetchAllPlays(headers);
  console.log(`Fetched ${plays.length} plays`);

  const playsData = buildPlaysData(plays);
  writeJson('bgg-plays.json', playsData, true);
  console.log(`Wrote ${playsData.plays.length} dated plays of ${Object.keys(playsData.games).length} games`);

  const recentIds = [];
  for (const play of plays) {
    if (recentIds.length >= RECENT_GAMES) break;
    if (!recentIds.includes(play.id)) recentIds.push(play.id);
  }

  if (recentIds.length === 0) {
    console.log('No games found, writing empty array');
    writeJson('bgg-games.json', []);
    return;
  }

  const thingsXml = await fetchXml(`${API}/things?id=${recentIds.join(',')}`, headers);
  const things = parseThingsXml(thingsXml);
  const recentGames = recentIds
    .map((id) => things.find((game) => game.id === id))
    .filter(Boolean)
    .map((game) => ({
      id: game.id,
      name: game.name,
      href: `https://boardgamegeek.com/boardgame/${game.id}`,
      imgSrc: game.imgSrc,
    }));

  const outputPath = writeJson('bgg-games.json', recentGames);
  console.log(`Successfully wrote ${recentGames.length} games to ${outputPath}`);
}

module.exports = { decodeEntities, parsePlaysXml, parseThingsXml, buildPlaysData };

if (require.main === module) {
  fetchBGGData().catch((err) => {
    console.error('Error fetching BGG data:', err);
    process.exit(1);
  });
}
