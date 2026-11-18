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

export interface PlaySummary {
  totalPlays: number;
  totalGames: number;
  daysPlayed: number;
  busiestDay: { date: string; total: number } | null;
  /** Ranked by number of plays. */
  mostPlayed: GameStats[];
  /** One entry per calendar month in the range, including months without plays. */
  byMonth: { month: string; value: number }[];
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

/** All-time stats per game id. */
export const statsByGame = aggregateGames(rows);

export const latestPlayDate = rows.reduce((latest, row) => (row[0] > latest ? row[0] : latest), '');
export const firstPlayDate = rows.reduce((first, row) => (row[0] < first ? row[0] : first), latestPlayDate);

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

/** Everything the stats section shows for the plays between `from` and `to`, inclusive. */
export function summarizePlays(from: string, to: string): PlaySummary {
  const selected = rows.filter((row) => row[0] >= from && row[0] <= to);

  const dayTotals = new Map<string, number>();
  const monthTotals = new Map<string, number>();
  let totalPlays = 0;
  for (const [date, , quantity] of selected) {
    totalPlays += quantity;
    dayTotals.set(date, (dayTotals.get(date) ?? 0) + quantity);
    const month = date.slice(0, 7);
    monthTotals.set(month, (monthTotals.get(month) ?? 0) + quantity);
  }

  let busiestDay: PlaySummary['busiestDay'] = null;
  dayTotals.forEach((total, date) => {
    if (!busiestDay || total > busiestDay.total || (total === busiestDay.total && date > busiestDay.date)) {
      busiestDay = { date, total };
    }
  });

  const games = aggregateGames(selected);
  return {
    totalPlays,
    totalGames: games.size,
    daysPlayed: dayTotals.size,
    busiestDay,
    mostPlayed: Array.from(games.values()).sort(byRank),
    byMonth:
      from && to && from <= to
        ? monthRange(from.slice(0, 7), to.slice(0, 7)).map((month) => ({ month, value: monthTotals.get(month) ?? 0 }))
        : [],
  };
}
