export type Team = {
  id: string
  name: string
  player: string
  seed: number
}

export type MatchSlot = {
  teamId: string | null
  /** Map wins in a best-of-3 series (0–2). */
  score: number
}

export type Match = {
  id: string
  roundIndex: number
  matchIndex: number
  slots: [MatchSlot, MatchSlot]
  winnerId: string | null
}

export type BracketState = {
  teams: Team[]
  matches: Match[]
  size: number
}

/** Maps needed to win a series. 1 = straight knockout. */
export const WINS_NEEDED = 1
