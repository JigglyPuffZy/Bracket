import type { Team } from './types'

/** Team name is after the dash; player is before. 18 teams. */
export const ROSTER: Omit<Team, 'id' | 'seed'>[] = [
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
]

export function createRosterTeams(): Team[] {
  return ROSTER.map((entry, i) => ({
    id: `team-${i + 1}`,
    seed: i + 1,
    name: entry.name,
    player: entry.player,
  }))
}
