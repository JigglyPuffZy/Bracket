import { createRosterTeams } from './roster'
import type { BracketState, Match, Team } from './types'
import { WINS_NEEDED } from './types'

function shuffle<T>(items: T[]): T[] {
  const list = [...items]
  // Crypto randomness when available so pairings stay unbiased
  const rand =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? () => {
          const buf = new Uint32Array(1)
          crypto.getRandomValues(buf)
          return buf[0]! / 2 ** 32
        }
      : Math.random

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function coinFlip() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return (buf[0]! & 1) === 1
  }
  return Math.random() < 0.5
}

/** Match counts per round (includes one-team bye matches when needed). */
function planRounds(teamCount: number): number[] {
  const plan: number[] = []
  let remaining = teamCount
  while (remaining > 1) {
    const playMatches = Math.floor(remaining / 2)
    const byeMatches = remaining % 2
    plan.push(playMatches + byeMatches)
    remaining = playMatches + byeMatches
  }
  return plan
}

function slot(teamId: string | null, score = 0) {
  return { teamId, score }
}

/**
 * Knockout bracket — fully random Round 1 pairings (no seeding bias).
 * Bracket field is 18 teams → 9 opening matches (display roster may be larger).
 */
export function createBracket(): BracketState {
  const teams = createRosterTeams()
  const shuffledIds = shuffle(teams.map((team) => team.id))

  // Random pairs, then randomize side (top/bottom), then shuffle match order
  const pairs: Array<[string, string]> = []
  for (let i = 0; i + 1 < shuffledIds.length; i += 2) {
    const a = shuffledIds[i]!
    const b = shuffledIds[i + 1]!
    pairs.push(coinFlip() ? [a, b] : [b, a])
  }
  const round1Pairs = shuffle(pairs)

  // Odd team would bye — not expected with even field, but keep safe
  const byeId =
    shuffledIds.length % 2 === 1 ? shuffledIds[shuffledIds.length - 1]! : null

  const plan = planRounds(teams.length)
  const matches: Match[] = []

  for (let r = 0; r < plan.length; r++) {
    for (let m = 0; m < plan[r]; m++) {
      let top: string | null = null
      let bottom: string | null = null

      if (r === 0) {
        if (m < round1Pairs.length) {
          top = round1Pairs[m]![0]
          bottom = round1Pairs[m]![1]
        } else if (byeId) {
          top = byeId
        }
      }

      matches.push({
        id: `r${r}-m${m}`,
        roundIndex: r,
        matchIndex: m,
        slots: [slot(top), slot(bottom)],
        winnerId: null,
      })
    }
  }

  return applyByes({
    teams,
    matches,
    size: teams.length,
  })
}

function applyByes(state: BracketState): BracketState {
  const matches = state.matches.map((m) => ({
    ...m,
    slots: [...m.slots] as Match['slots'],
  }))

  for (const match of matches) resolveMatchWinner(match)

  return { ...state, matches: reconcile(matches) }
}

export function getRounds(state: BracketState): Match[][] {
  const maxRound = state.matches.reduce((max, m) => Math.max(max, m.roundIndex), 0)
  return Array.from({ length: maxRound + 1 }, (_, r) =>
    state.matches
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.matchIndex - b.matchIndex),
  )
}

export function getTeam(state: BracketState, teamId: string | null): Team | null {
  if (!teamId) return null
  return state.teams.find((t) => t.id === teamId) ?? null
}

export function roundLabel(roundIndex: number, roundsTotal: number): string {
  const fromEnd = roundsTotal - 1 - roundIndex
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semifinals'
  if (fromEnd === 2) return 'Quarterfinals'
  if (roundIndex === 0) return 'Round 1'
  return `Round ${roundIndex + 1}`
}

function resolveMatchWinner(match: Match) {
  const [a, b] = match.slots
  if (a.teamId && !b.teamId) {
    match.winnerId = a.teamId
    return
  }
  if (b.teamId && !a.teamId) {
    match.winnerId = b.teamId
    return
  }
  if (!a.teamId || !b.teamId) {
    match.winnerId = null
    return
  }

  if (a.score >= WINS_NEEDED) match.winnerId = a.teamId
  else if (b.score >= WINS_NEEDED) match.winnerId = b.teamId
  else match.winnerId = null
}

function fillRoundFromAdvancing(nextRound: Match[], advancing: string[]) {
  for (const match of nextRound) {
    match.slots = [slot(null), slot(null)]
    match.winnerId = null
  }

  const playPairs = Math.floor(advancing.length / 2)
  const hasBye = advancing.length % 2 === 1

  for (let i = 0; i < playPairs; i++) {
    const match = nextRound[i]
    if (!match) break
    match.slots = [slot(advancing[i * 2]), slot(advancing[i * 2 + 1])]
    match.winnerId = null
  }

  if (hasBye) {
    const match = nextRound[playPairs]
    if (match) {
      match.slots = [slot(advancing[advancing.length - 1]), slot(null)]
      match.winnerId = advancing[advancing.length - 1]
    }
  }
}

function reconcile(matches: Match[]): Match[] {
  const byKey = new Map(
    matches.map((m) => [
      `${m.roundIndex}-${m.matchIndex}`,
      {
        ...m,
        slots: [
          { ...m.slots[0] },
          { ...m.slots[1] },
        ] as Match['slots'],
      },
    ]),
  )

  const maxRound = matches.reduce((max, m) => Math.max(max, m.roundIndex), 0)

  for (let r = 0; r <= maxRound; r++) {
    const roundMatches = [...byKey.values()]
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.matchIndex - b.matchIndex)

    for (const match of roundMatches) resolveMatchWinner(match)

    if (r === maxRound) break

    const advancing = roundMatches
      .map((m) => m.winnerId)
      .filter((id): id is string => Boolean(id))

    const nextRound = [...byKey.values()]
      .filter((m) => m.roundIndex === r + 1)
      .sort((a, b) => a.matchIndex - b.matchIndex)

    fillRoundFromAdvancing(nextRound, advancing)
  }

  return Array.from(byKey.values())
}

/** Award a win in a knockout match. */
export function awardGameWin(
  state: BracketState,
  matchId: string,
  teamId: string,
): BracketState {
  const match = state.matches.find((m) => m.id === matchId)
  if (!match) return state
  if (!match.slots[0].teamId || !match.slots[1].teamId) return state
  if (!match.slots.some((s) => s.teamId === teamId)) return state
  if (match.winnerId) return state

  const nextMatches = state.matches.map((m) => {
    if (m.id !== matchId) {
      return {
        ...m,
        slots: [{ ...m.slots[0] }, { ...m.slots[1] }] as Match['slots'],
      }
    }

    const slots = [{ ...m.slots[0] }, { ...m.slots[1] }] as Match['slots']
    const index = slots.findIndex((s) => s.teamId === teamId)
    if (index < 0) return m

    slots[index] = {
      ...slots[index],
      score: Math.min(WINS_NEEDED, slots[index].score + 1),
    }

    return { ...m, slots, winnerId: null }
  })

  return { ...state, matches: reconcile(nextMatches) }
}

export function getChampion(state: BracketState): Team | null {
  const rounds = getRounds(state)
  const final = rounds[rounds.length - 1]?.[0]
  if (!final?.winnerId) return null
  return getTeam(state, final.winnerId)
}

export function countPlayableMatches(state: BracketState): number {
  return state.matches.filter((m) => m.slots[0].teamId && m.slots[1].teamId).length
}
