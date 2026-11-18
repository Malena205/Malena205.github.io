import playsData from '../../public/bgg-plays.json';
import recentGamesData from '../../public/bgg-games.json';
import { monthRange } from './dates';

export interface RecentGame {
  id?: string;
  name: string;
  href: string;
  imgSrc: string;
}

export interface GameStats {
  id: string;
  name: string;
  href: string;
  plays: number;
  firstPlayed: string;
  lastPlayed: string;
}

export interface DayPlays {
  total: number;
  games: { name: string; plays: number }[];
}

/** [date, game id, quantity], newest first */
type PlayRow = [string, string, number];

const rows = playsData.plays as PlayRow[];
const gameNames = playsData.games as Record<string, string>;

export const recentGames = recentGamesData as RecentGame[];

export const gameHref = (id: string) => `https://boardgamegeek.com/boardgame/${id}`;

function aggregateGames(selected: PlayRow[]) {
  const byId = new Map<string, GameStats>();
  for (const [date, id, quantity] of selected) {
    const game = byId.get(id);
    if (!game) {
      byId.set(id, {
        id,
        name: gameNames[id] ?? 'Unknown game',
        href: gameHref(id),
        plays: quantity,
        firstPlayed: date,
        lastPlayed: date,
      });
    } else {
      game.plays += quantity;
      if (date < game.firstPlayed) game.firstPlayed = date;
      if (date > game.lastPlayed) game.lastPlayed = date;
    }
  }
  return byId;
}

const byRank = (a: GameStats, b: GameStats) =>
  b.plays - a.plays || b.lastPlayed.localeCompare(a.lastPlayed) || a.name.localeCompare(b.name);

export const statsByGame = aggregateGames(rows);

export const mostPlayed = Array.from(statsByGame.values()).sort(byRank);

export const latestPlayDate = rows.reduce((latest, row) => (row[0] > latest ? row[0] : latest), '');
export const firstPlayDate = rows.reduce((first, row) => (row[0] < first ? row[0] : first), latestPlayDate);

export const totalPlays = rows.reduce((sum, row) => sum + row[2], 0);
export const totalGames = statsByGame.size;

export const playsByDay = (() => {
  const days = new Map<string, DayPlays>();
  for (const [date, id, quantity] of rows) {
    const day = days.get(date) ?? { total: 0, games: [] };
    const name = gameNames[id] ?? 'Unknown game';
    const existing = day.games.find((game) => game.name === name);
    if (existing) existing.plays += quantity;
    else day.games.push({ name, plays: quantity });
    day.total += quantity;
    days.set(date, day);
  }
  days.forEach((day) => day.games.sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name)));
  return days;
})();

export const playsByMonth = (() => {
  if (!latestPlayDate) return [];
  const totals = new Map<string, number>();
  for (const [date, , quantity] of rows) {
    const month = date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + quantity);
  }
  return monthRange(firstPlayDate.slice(0, 7), latestPlayDate.slice(0, 7)).map((month) => ({
    month,
    value: totals.get(month) ?? 0,
  }));
})();

export const busiestDay = Array.from(playsByDay.entries()).reduce<{ date: string; total: number } | null>(
  (best, [date, day]) => (!best || day.total > best.total ? { date, total: day.total } : best),
  null,
);

export function playsInYear(year: string) {
  return rows.reduce((sum, row) => (row[0].startsWith(year) ? sum + row[2] : sum), 0);
}
