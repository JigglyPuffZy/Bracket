import { createBracket } from './bracket'
import { ROSTER } from './roster'
import type { BracketState } from './types'

const STORAGE_KEY = 'ml-tournament-bracket-v1'

/** Fingerprint so a roster change invalidates a saved bracket. */
function rosterFingerprint(): string {
  return ROSTER.map(
    (t) => `${t.name}|${t.player}|${t.inBracket === false ? 0 : 1}`,
  ).join(';;')
}

function isValidState(value: unknown): value is BracketState {
  if (!value || typeof value !== 'object') return false
  const s = value as BracketState
  return (
    Array.isArray(s.teams) &&
    Array.isArray(s.matches) &&
    typeof s.size === 'number' &&
    s.teams.length > 0 &&
    s.matches.length > 0
  )
}

export function loadBracket(): BracketState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const fresh = createBracket()
      saveBracket(fresh)
      return fresh
    }

    const parsed = JSON.parse(raw) as { fingerprint?: string; state?: unknown }
    if (
      parsed.fingerprint === rosterFingerprint() &&
      isValidState(parsed.state)
    ) {
      return parsed.state
    }
  } catch {
    // Corrupt or unavailable storage — fall through to a new bracket
  }

  const fresh = createBracket()
  saveBracket(fresh)
  return fresh
}

export function saveBracket(state: BracketState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fingerprint: rosterFingerprint(), state }),
    )
  } catch {
    // Quota / private mode — bracket still works for this session
  }
}
