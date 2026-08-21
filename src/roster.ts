import type { Team } from './types'

export type RosterEntry = Omit<Team, 'id' | 'seed'> & {
  /** When false, listed as a participant but not placed in the bracket. */
  inBracket?: boolean
}

/** Team name is after the dash; player is before. */
export const ROSTER: RosterEntry[] = [
  { player: 'John Carlo Bulauan', name: 'Area51' },
  { player: 'Juriz Perez', name: 'T7' },
  { player: 'Ariel zipagan', name: 'Favian empire' },
  { player: 'Bon Cabalza', name: "Six saint's" },
  { player: 'Raul Bulusan', name: 'ExtremeRadicals' },
  { player: 'Jayson Navarro', name: 'TEAM SR' },
  { player: 'Francis Buraga', name: 'Raging Thunder' },
  { player: 'Janndrix Pagulayan', name: 'HR APEX' },
  { player: 'Jhimrex Zipagan', name: 'CLVB' },
  { player: 'Justin Tabug', name: 'this is lans' },
  { player: 'Patrick Damagan', name: 'ESPADA' },
  { player: 'Jonel Aler', name: 'IRA Chowbears' },
  { player: 'Enzo Taguiam', name: 'ALPHA' },
  { player: 'Tj Turaray', name: 'Tipsy' },
  { player: 'Ryan Charles Ani', name: 'pwede na' },
  { player: 'Clarence Gallardo', name: 'Psychology' },
  { player: 'Jom Bautista', name: 'Solid x Liquid' },
  { player: 'John Vincent telan', name: 'STPH' },
  { player: 'Jn Laurence Bagunu', name: 'Pitipiwpiw', inBracket: false },
]

/** Teams that play in the knockout bracket (excludes display-only entries). */
export function createRosterTeams(): Team[] {
  return ROSTER.filter((entry) => entry.inBracket !== false).map((entry, i) => ({
    id: `team-${i + 1}`,
    seed: i + 1,
    name: entry.name,
    player: entry.player,
  }))
}
