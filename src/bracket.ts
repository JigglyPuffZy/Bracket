import { createRosterTeams } from './roster'
import type { BracketState, Match, Team } from './types'

function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function shuffle<T>(items: T[]): T[] {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

/**
 * Build a shuffled single-elim bracket.
 * Extra teams beyond the next lower power of two play each other first;
 * everyone else gets a bye into the main draw.
 */
export function createBracket(): BracketState {
  const size = nextPowerOfTwo(createRosterTeams().length)
  const rounds = Math.log2(size)
  const firstRoundMatches = size / 2

  const shuffled = shuffle(createRosterTeams()).map((team, index) => ({
    ...team,
    id: `team-${index + 1}`,
    seed: index + 1,
  }))

  const byeCount = size - shuffled.length
  const playCount = shuffled.length - byeCount
  const playMatchCount = playCount / 2

  const playTeams = shuffled.slice(0, playCount)
  const byeTeams = shuffled.slice(playCount)

  const playMatchIndexes = new Set(
    shuffle([...Array(firstRoundMatches).keys()]).slice(0, playMatchCount),
  )

  const firstRoundSlots: Array<[string | null, string | null]> = []
  let playCursor = 0
  let byeCursor = 0

  for (let m = 0; m < firstRoundMatches; m++) {
    if (playMatchIndexes.has(m)) {
      firstRoundSlots.push([playTeams[playCursor].id, playTeams[playCursor + 1].id])
      playCursor += 2
    } else if (byeCursor < byeTeams.length) {
      // Randomize which side gets the bye team
      if (Math.random() < 0.5) {
        firstRoundSlots.push([byeTeams[byeCursor].id, null])
      } else {
        firstRoundSlots.push([null, byeTeams[byeCursor].id])
      }
      byeCursor += 1
    } else {
      firstRoundSlots.push([null, null])
    }
  }

  const matches: Match[] = []

  for (let r = 0; r < rounds; r++) {
    const matchCount = size / 2 ** (r + 1)
    for (let m = 0; m < matchCount; m++) {
      const slots =
        r === 0
          ? firstRoundSlots[m]
          : ([null, null] as [string | null, string | null])

      matches.push({
        id: `r${r}-m${m}`,
        roundIndex: r,
        matchIndex: m,
        slots: [
          { teamId: slots[0], score: null },
          { teamId: slots[1], score: null },
        ],
        winnerId: null,
      })
    }
  }

  return applyByes({ teams: shuffled, matches, size })
}

/** Auto-advance first-round matches that only have one real team (bye). */
function applyByes(state: BracketState): BracketState {
  const matches = state.matches.map((m) => ({
    ...m,
    slots: [...m.slots] as Match['slots'],
  }))

  for (const match of matches) {
    if (match.roundIndex !== 0) continue
    const [a, b] = match.slots
    if (a.teamId && !b.teamId) match.winnerId = a.teamId
    else if (b.teamId && !a.teamId) match.winnerId = b.teamId
  }

  return { ...state, matches: reconcile(matches, state.size) }
}

export function getRounds(state: BracketState): Match[][] {
  const count = Math.log2(state.size)
  return Array.from({ length: count }, (_, r) =>
    state.matches
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.matchIndex - b.matchIndex),
  )
}

export function getTeam(state: BracketState, teamId: string | null): Team | null {
  if (!teamId) return null
  return state.teams.find((t) => t.id === teamId) ?? null
}

export function roundLabel(roundIndex: number, size: number): string {
  const remaining = size / 2 ** roundIndex
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinals'
  if (remaining === 8) return 'Quarterfinals'
  if (remaining === 16) return 'Round of 16'
  if (remaining === 32) return 'Round of 32'
  return `Round ${roundIndex + 1}`
}

function reconcile(matches: Match[], size: number): Match[] {
  const byKey = new Map(
    matches.map((m) => [
      `${m.roundIndex}-${m.matchIndex}`,
      { ...m, slots: [...m.slots] as Match['slots'] },
    ]),
  )
  const rounds = Math.log2(size)

  for (let r = 0; r < rounds; r++) {
    const matchCount = size / 2 ** (r + 1)
    for (let m = 0; m < matchCount; m++) {
      const match = byKey.get(`${r}-${m}`)!
      const [a, b] = match.slots
      const bothReady = Boolean(a.teamId && b.teamId)
      const winnerStillValid =
        bothReady && (match.winnerId === a.teamId || match.winnerId === b.teamId)

      const isByeWin =
        r === 0 &&
        Boolean(match.winnerId) &&
        ((a.teamId === match.winnerId && !b.teamId) ||
          (b.teamId === match.winnerId && !a.teamId))

      match.winnerId = winnerStillValid || isByeWin ? match.winnerId : null

      if (r < rounds - 1) {
        const next = byKey.get(`${r + 1}-${Math.floor(m / 2)}`)!
        const slot = m % 2
        const nextSlots = [...next.slots] as Match['slots']
        nextSlots[slot] = {
          teamId: match.winnerId,
          score: null,
        }
        next.slots = nextSlots
      }
    }
  }

  return Array.from(byKey.values())
}

export function selectWinner(
  state: BracketState,
  matchId: string,
  winnerId: string,
): BracketState {
  const match = state.matches.find((m) => m.id === matchId)
  if (!match) return state
  if (!match.slots[0].teamId || !match.slots[1].teamId) return state
  if (!match.slots.some((s) => s.teamId === winnerId)) return state

  const nextMatches = state.matches.map((m) =>
    m.id === matchId
      ? { ...m, winnerId, slots: [...m.slots] as Match['slots'] }
      : { ...m, slots: [...m.slots] as Match['slots'] },
  )

  return { ...state, matches: reconcile(nextMatches, state.size) }
}

export function getChampion(state: BracketState): Team | null {
  const final = state.matches.find((m) => m.roundIndex === Math.log2(state.size) - 1)
  if (!final?.winnerId) return null
  return getTeam(state, final.winnerId)
}

export function countPlayableMatches(state: BracketState): number {
  return state.matches.filter((m) => m.slots[0].teamId && m.slots[1].teamId).length
}
