export type Team = {
  id: string
  name: string
  player: string
  seed: number
}

export type MatchSlot = {
  teamId: string | null
  score: number | null
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
